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
    #[serde(rename = "Keywords")]
    keywords: Option<String>,
    #[serde(rename = "DownloadCount")]
    download_count: i64,
    #[serde(rename = "CreatedAt")]
    created_at: String,
    #[serde(rename = "UpdatedAt")]
    updated_at: String,
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

    MarketplaceListing {
        id: skill.slug.clone(),
        name: skill.name.clone(),
        description: skill.description.clone(),
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

    api_response
        .skills
        .iter()
        .find(|s| s.slug == id)
        .map(convert_findskill_to_listing)
        .ok_or_else(|| format!("Listing {} not found", id))
}

#[tauri::command]
pub async fn download_marketplace_skill(
    id: String,
    storage_path: String,
) -> Result<String, String> {
    // Fetch the skill details first
    let listing = get_marketplace_listing_detail(id.clone()).await?;

    // Generate skill content
    let skill_content = generate_skill_content(&listing);

    // Resolve storage path
    let mut dest_path = PathBuf::from(&storage_path);
    if dest_path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            let mut p = home;
            p.push(&dest_path.to_string_lossy().to_string()[2..]);
            dest_path = p;
        }
    }

    fs::create_dir_all(&dest_path).map_err(|e| e.to_string())?;

    let file_name = format!("{}.md", listing.name.to_lowercase().replace(' ', "-"));
    let file_path = dest_path.join(&file_name);

    fs::write(&file_path, skill_content).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
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

fn generate_skill_content(listing: &MarketplaceListing) -> String {
    format!(
        r#"# {name}

## Description

{description}

## Author

{author}

## Version

{version}

## Tags

{tags}

## Installation

1. Download this skill file
2. Place it in your skills directory
3. Configure as needed

## Usage

Describe how to use this skill here.

## Configuration

Add any configuration options here.
"#,
        name = listing.name,
        description = listing.description,
        author = listing.author,
        version = listing.version,
        tags = listing.tags.join(", ")
    )
}
