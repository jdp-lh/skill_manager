use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use crate::config::get_config;

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillEntry {
    pub name: String,
    pub is_dir: bool,
    pub last_modified: u64,
    pub path: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillTestResult {
    pub agent_id: String,
    pub skill_name: String,
    pub status: String,
    pub message: String,
    pub priority: i32,
    pub parameter_count: usize,
}

fn compare_skill_names(left: &str, right: &str) -> std::cmp::Ordering {
    left.to_lowercase()
        .cmp(&right.to_lowercase())
        .then_with(|| left.cmp(right))
}

pub fn resolve_skill_content_path(path: &str) -> Result<PathBuf, String> {
    let skill_path = PathBuf::from(path);

    if skill_path.is_dir() {
        let candidates = [
            skill_path.join("SKILL.md"),
            skill_path.join("skill.md"),
            skill_path.join("README.md"),
            skill_path.join("readme.md"),
            skill_path.join("index.md"),
        ];

        for candidate in candidates {
            if candidate.is_file() {
                return Ok(candidate);
            }
        }

        return Err(format!("No editable skill file found in {}", path));
    }

    Ok(skill_path)
}

fn get_global_metadata_path(path: &PathBuf) -> Option<PathBuf> {
    // Navigate up to find the `.skills-manager` directory
    let mut current = path.clone();
    while let Some(parent) = current.parent() {
        if parent.ends_with(".skills-manager") {
            return Some(parent.join("metadata.json"));
        }
        if let Some(file_name) = parent.file_name() {
            if file_name == ".skills-manager" {
                return Some(parent.join("metadata.json"));
            }
        }
        current = parent.to_path_buf();
    }
    
    // Fallback: try to construct from home directory if we can't find it walking up
    dirs::home_dir().map(|home| home.join(".skills-manager").join("metadata.json"))
}

fn extract_skill_description(path: &PathBuf) -> String {
    // 优先从全局 metadata.json 读取
    let skill_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let skill_id = if skill_name.ends_with(".md") {
        skill_name.trim_end_matches(".md").to_string()
    } else {
        skill_name.clone()
    };

    if let Some(metadata_path) = get_global_metadata_path(path) {
        if metadata_path.exists() {
            if let Ok(content) = fs::read_to_string(&metadata_path) {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(skills) = json.get("skills").and_then(|s| s.as_object()) {
                        if let Some(skill_data) = skills.get(&skill_id).and_then(|s| s.as_object()) {
                            if let Some(desc) = skill_data.get("description").and_then(|d| d.as_str()) {
                                return desc.to_string();
                            }
                        }
                    }
                }
            }
        }
    }

    let content_path = resolve_skill_content_path(&path.to_string_lossy()).ok();

    let Some(content_path) = content_path else {
        return String::new();
    };

    let Ok(content) = fs::read_to_string(content_path) else {
        return String::new();
    };

    let mut in_frontmatter = false;
    let mut description_from_fm = String::new();
    let mut lines = content.lines().peekable();
    
    if let Some(&first_line) = lines.peek() {
        if first_line.trim() == "---" {
            in_frontmatter = true;
            lines.next(); 
        }
    }

    while let Some(raw_line) = lines.next() {
        let line = raw_line.trim();
        if in_frontmatter {
            if line == "---" {
                in_frontmatter = false;
                continue;
            }
            if line.to_lowercase().starts_with("description:") {
                let desc = line[12..].trim();
                let desc = desc.trim_matches(|c| c == '"' || c == '\'');
                if desc == "|" || desc == ">" || desc.is_empty() {
                    while let Some(&next_raw_line) = lines.peek() {
                        let next_line = next_raw_line.trim();
                        if next_line.is_empty() {
                            lines.next();
                            continue;
                        }
                        if next_line == "---" || (!next_raw_line.starts_with(' ') && next_line.contains(':')) {
                            break;
                        }
                        description_from_fm = next_line.to_string();
                        lines.next();
                        break;
                    }
                } else {
                    description_from_fm = desc.to_string();
                }
            }
        } else {
            if line.is_empty() {
                continue;
            }
            
            if let Some(start) = content.find("<description>") {
                let content_start = start + 13;
                if let Some(end) = content[content_start..].find("</description>") {
                    return content[content_start..content_start+end].trim().to_string();
                }
            }

            if !description_from_fm.is_empty() {
                return description_from_fm;
            }

            if line.starts_with('#') {
                let lower = line.to_lowercase();
                if lower == "## description" || lower == "# description" {
                    while let Some(next_raw_line) = lines.next() {
                        let next_line = next_raw_line.trim();
                        if !next_line.is_empty() {
                            return next_line.to_string();
                        }
                    }
                }
                continue;
            }

            if line.starts_with("---") {
                continue;
            }
            
            return line.to_string();
        }
    }

    if !description_from_fm.is_empty() {
        return description_from_fm;
    }

    String::new()
}

pub fn update_skill_description(skill_dir: &PathBuf, new_desc: &str) -> Result<(), String> {
    let skill_name = skill_dir.file_name().unwrap_or_default().to_string_lossy().to_string();
    let skill_id = if skill_name.ends_with(".md") {
        skill_name.trim_end_matches(".md").to_string()
    } else {
        skill_name.clone()
    };

    let metadata_path = get_global_metadata_path(skill_dir).unwrap_or_else(|| {
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".skills-manager")
            .join("metadata.json")
    });

    if let Some(parent) = metadata_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let mut metadata = if metadata_path.exists() {
        let content = fs::read_to_string(&metadata_path).unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str::<serde_json::Value>(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    if let Some(obj) = metadata.as_object_mut() {
        if !obj.contains_key("skills") {
            obj.insert("skills".to_string(), serde_json::json!({}));
        }
        
        if let Some(skills) = obj.get_mut("skills").and_then(|s| s.as_object_mut()) {
            if let Some(skill_data) = skills.get_mut(&skill_id).and_then(|s| s.as_object_mut()) {
                skill_data.insert("description".to_string(), serde_json::json!(new_desc));
            } else {
                skills.insert(skill_id, serde_json::json!({
                    "description": new_desc
                }));
            }
        }
    }

    fs::write(
        &metadata_path,
        serde_json::to_string_pretty(&metadata).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn list_skills(dir: String) -> Result<Vec<SkillEntry>, String> {
    println!("DEBUG: list_skills called for dir: {}", dir);
    let mut entries = Vec::new();
    let path = PathBuf::from(&dir);
    
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }

    if path.is_dir() {
        for entry in fs::read_dir(path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().to_string();
            
            // 移除对隐藏文件的过滤，支持显示 . 开头的文件和目录
            
            let is_dir = metadata.is_dir();
            let last_modified = metadata
                .modified()
                .map_err(|e| e.to_string())?
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
                
            entries.push(SkillEntry {
                name,
                is_dir,
                last_modified,
                path: path.to_string_lossy().to_string(),
                description: extract_skill_description(&path),
            });
        }
    }
    
    entries.sort_by(|a, b| compare_skill_names(&a.name, &b.name));
    
    Ok(entries)
}

#[tauri::command]
pub fn read_skill_file(path: String) -> Result<String, String> {
    let resolved_path = resolve_skill_content_path(&path)?;
    fs::read_to_string(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_skill_file(path: String, content: String) -> Result<(), String> {
    let p = resolve_skill_content_path(&path)?;
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(p, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_skill(path: String) -> Result<(), String> {
    println!("Deleting skill at path: {}", path);
    let p = std::path::PathBuf::from(&path);
    if !p.exists() {
        println!("Path does not exist, skipping deletion.");
        return Ok(());
    }
    let p = PathBuf::from(&path);
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn test_agent_skill(agent_id: String, skill_name: String) -> Result<SkillTestResult, String> {
    let config = get_config()?;
    let agent = config
        .agents
        .get(&agent_id)
        .ok_or_else(|| format!("Agent {} not found", agent_id))?;

    let storage_path = PathBuf::from(&config.storage_path);
    let skill_path = storage_path.join(&skill_name);
    if !skill_path.exists() {
        return Err(format!("Skill {} not found", skill_name));
    }

    let agent_settings = config
        .agent_skill_settings
        .get(&agent_id)
        .and_then(|items| items.get(&skill_name))
        .cloned()
        .unwrap_or_default();

    let resolved_path = resolve_skill_content_path(&skill_path.to_string_lossy())?;
    let content = fs::read_to_string(resolved_path).map_err(|e| e.to_string())?;
    let line_count = content.lines().count();
    let message = format!(
        "{} 已通过测试：文件可读取，共 {} 行，优先级 {}，参数 {} 个。",
        agent.name,
        line_count,
        agent_settings.priority,
        agent_settings.parameters.len()
    );

    Ok(SkillTestResult {
        agent_id,
        skill_name,
        status: "success".to_string(),
        message,
        priority: agent_settings.priority,
        parameter_count: agent_settings.parameters.len(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(name: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("skills-manager-{}-{}", name, nanos))
    }

    #[test]
    fn resolve_skill_content_path_uses_skill_md_in_directory() {
        let dir = unique_temp_dir("resolve-skill-dir");
        fs::create_dir_all(&dir).unwrap();
        let skill_file = dir.join("SKILL.md");
        fs::write(&skill_file, "# test").unwrap();

        let resolved = resolve_skill_content_path(&dir.to_string_lossy()).unwrap();

        assert_eq!(resolved, skill_file);

        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn write_skill_file_updates_skill_md_for_directory_skill() {
        let dir = unique_temp_dir("write-skill-dir");
        fs::create_dir_all(&dir).unwrap();
        let skill_file = dir.join("SKILL.md");
        fs::write(&skill_file, "# old").unwrap();

        write_skill_file(dir.to_string_lossy().to_string(), "# new".to_string()).unwrap();

        assert_eq!(fs::read_to_string(skill_file).unwrap(), "# new");

        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn test_extract_skill_description_empty_with_next_key() {
        let dir = unique_temp_dir("extract-skill-empty");
        fs::create_dir_all(&dir).unwrap();
        let skill_file = dir.join("SKILL.md");
        let content = r#"---
name: ambivo
description:
compatibility: Requires network access.
---

# Ambivo
Some other text
"#;
        fs::write(&skill_file, content).unwrap();

        let desc = extract_skill_description(&skill_file);
        assert_eq!(desc, "Some other text"); // Since fm description is empty, it falls back to the first line after `# Ambivo`

        fs::remove_dir_all(dir).unwrap();
    }
}
