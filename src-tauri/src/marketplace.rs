use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const API_BASE_URL: &str = "https://skills.volces.com/v1";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketplaceListing {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
    pub tags: Vec<String>,
    pub download_count: u64,
    pub source: String,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketplaceCategory {
    pub id: String,
    pub name: String,
    pub count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MarketplaceListingsResponse {
    pub listings: Vec<MarketplaceListing>,
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
}

// API Response structures for findskill.com
#[derive(Debug, Deserialize)]
struct FindSkillApiResponse {
    #[serde(rename = "Skills")]
    skills: Vec<FindSkillSkill>,
    #[serde(rename = "Total")]
    total: i64,
}

#[derive(Debug, Deserialize)]
struct FindSkillDetailApiResponse {
    #[serde(rename = "Skill")]
    skill: FindSkillSkill,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct FindSkillSkillMetadata {
    #[serde(rename = "DisplayDescription")]
    display_description: Option<String>,
    #[serde(rename = "Files")]
    files: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct FindSkillSkill {
    #[serde(rename = "Slug")]
    slug: String,
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "Description")]
    description: String,
    #[serde(rename = "SourceType")]
    source_type: String,
    #[serde(rename = "SourceRepo")]
    source_repo: String,
    #[serde(rename = "SkillMarkdown")]
    skill_markdown: Option<String>,
    #[serde(rename = "Keywords")]
    keywords: Option<String>,
    #[serde(rename = "DownloadCount")]
    download_count: i64,
    #[serde(rename = "CreatedAt")]
    created_at: String,
    #[serde(rename = "UpdatedAt")]
    updated_at: String,
    #[serde(rename = "Metadata")]
    metadata: Option<FindSkillSkillMetadata>,
}

// Convert FindSkill API skill to our MarketplaceListing format
fn convert_findskill_to_listing(skill: &FindSkillSkill) -> MarketplaceListing {
    // Parse tags from keywords (comma-separated)
    let tags: Vec<String> = skill
        .keywords
        .as_ref()
        .map(|k| k.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_default();

    // Extract author from source_repo (e.g., "volcengine/documentation" -> "volcengine")
    let author = skill
        .source_repo
        .split('/')
        .next()
        .unwrap_or("unknown")
        .to_string();

    // Prefer Chinese display description from metadata, fallback to English description
    let description = skill
        .metadata
        .as_ref()
        .and_then(|m| m.display_description.clone())
        .filter(|d| !d.is_empty())
        .unwrap_or_else(|| skill.description.clone());

    MarketplaceListing {
        id: skill.slug.clone(),
        name: skill.name.clone(),
        description,
        author,
        version: "1.0.0".to_string(), // API doesn't provide version
        tags,
        download_count: skill.download_count.max(0) as u64,
        source: skill.source_type.clone(),
        content: None,
    }
}

#[tauri::command]
pub async fn get_marketplace_listings(
    page: Option<usize>,
    page_size: Option<usize>,
    category: Option<String>,
    search: Option<String>,
) -> Result<MarketplaceListingsResponse, String> {
    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20).min(100);

    // Build API URL
    let mut url = format!("{}/skills?pageNumber={}&pageSize={}", API_BASE_URL, page, page_size);

    // Add search query if provided
    if let Some(query) = search {
        if !query.trim().is_empty() {
            url.push_str(&format!("&query={}", urlencoding::encode(&query)));
        }
    }

    // Make HTTP request
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch skills: {}", e))?;

    let api_response: FindSkillApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Convert API response to our format
    let listings: Vec<MarketplaceListing> = api_response
        .skills
        .iter()
        .map(convert_findskill_to_listing)
        .collect();

    // Use API's total count for pagination
    let api_total = api_response.total as usize;

    // Check if we need to filter by category before consuming category
    let has_category_filter = category.as_ref().map(|c| !c.is_empty() && c != "all").unwrap_or(false);

    // Filter by category if provided (client-side filtering since API doesn't support it)
    let filtered_listings = if let Some(cat) = category {
        if !cat.is_empty() && cat != "all" {
            listings
                .into_iter()
                .filter(|l| {
                    l.tags
                        .iter()
                        .any(|t| t.to_lowercase().contains(&cat.to_lowercase()))
                        || l.source.to_lowercase().contains(&cat.to_lowercase())
                })
                .collect()
        } else {
            listings
        }
    } else {
        listings
    };

    // Use API total for pagination, but if filtering by category, use filtered count
    let total = if has_category_filter {
        filtered_listings.len()
    } else {
        api_total
    };

    Ok(MarketplaceListingsResponse {
        listings: filtered_listings,
        total,
        page,
        page_size,
    })
}

#[tauri::command]
pub async fn get_marketplace_categories() -> Result<Vec<MarketplaceCategory>, String> {
    // Since the API doesn't have a dedicated categories endpoint,
    // we'll fetch some skills and derive categories from source_type
    let url = format!("{}/skills?pageNumber=1&pageSize=100", API_BASE_URL);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch skills: {}", e))?;

    let api_response: FindSkillApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Count skills by source_type as categories
    use std::collections::HashMap;
    let mut category_counts: HashMap<String, u32> = HashMap::new();

    for skill in &api_response.skills {
        *category_counts.entry(skill.source_type.clone()).or_insert(0) += 1;
    }

    // Also extract keywords as categories
    for skill in &api_response.skills {
        if let Some(keywords) = &skill.keywords {
            for keyword in keywords.split(',') {
                let kw = keyword.trim().to_lowercase();
                if !kw.is_empty() {
                    *category_counts.entry(kw).or_insert(0) += 1;
                }
            }
        }
    }

    let categories: Vec<MarketplaceCategory> = category_counts
        .into_iter()
        .map(|(name, count)| MarketplaceCategory {
            id: name.clone(),
            name: name.clone(),
            count,
        })
        .collect();

    Ok(categories)
}

#[tauri::command]
pub async fn get_marketplace_listing_detail(id: String) -> Result<MarketplaceListing, String> {
    // Fetch listing by searching for the specific slug
    let url = format!("{}/skills/{}", API_BASE_URL, id);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch skill details: {}", e))?;

    let api_response: FindSkillDetailApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut listing = convert_findskill_to_listing(&api_response.skill);
    
    // Use SkillMarkdown as content if it is available, otherwise fall back to generation
    if let Some(markdown) = &api_response.skill.skill_markdown {
        if !markdown.is_empty() {
            listing.content = Some(markdown.clone());
        }
    }
    
    Ok(listing)
}


#[tauri::command]
pub async fn download_marketplace_skill(
    id: String,
    storage_path: String,
) -> Result<String, String> {
    // Resolve storage path
    let mut dest_path = PathBuf::from(&storage_path);
    if storage_path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            let mut p = home;
            p.push(&storage_path[2..]);
            dest_path = p;
        }
    }

    // Determine the final directory name for the skill
    let skill_name = id.split('/').last().unwrap_or("unknown_skill");
    let target_dir = dest_path.join(skill_name);
    fs::create_dir_all(&target_dir).map_err(|e| format!("Failed to create skill directory: {}", e))?;

    // The download URL is derived from the API endpoint
    let download_url = format!("{}/skills/download/{}", API_BASE_URL, id);
    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| format!("Failed to download zip: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to download zip from {}, status code: {}", download_url, response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read zip bytes: {}", e))?;

    let temp_dir = std::env::temp_dir();
    let temp_zip_path = temp_dir.join(format!("skill_{}.zip", skill_name));
    
    fs::write(&temp_zip_path, &bytes).map_err(|e| format!("Failed to write temporary zip file: {}", e))?;

    // Extract using unzip command
    let output = std::process::Command::new("unzip")
        .arg("-o")
        .arg(&temp_zip_path)
        .arg("-d")
        .arg(&target_dir)
        .output()
        .map_err(|e| {
            let _ = fs::remove_file(&temp_zip_path);
            format!("Failed to execute unzip command: {}", e)
        })?;

    let _ = fs::remove_file(&temp_zip_path);

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Unzip failed: {}", err_msg));
    }

    Ok("Success".to_string())
}

#[tauri::command]
pub async fn get_featured_marketplace_listings() -> Result<Vec<MarketplaceListing>, String> {
    // Get first page sorted by download count
    let url = format!("{}/skills?pageNumber=1&pageSize=24", API_BASE_URL);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch skills: {}", e))?;

    let api_response: FindSkillApiResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let mut listings: Vec<MarketplaceListing> = api_response
        .skills
        .iter()
        .map(convert_findskill_to_listing)
        .collect();

    // Sort by download count and take top 4
    listings.sort_by(|a, b| b.download_count.cmp(&a.download_count));
    listings.truncate(4);

    Ok(listings)
}

