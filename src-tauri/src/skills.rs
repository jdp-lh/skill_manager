use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use crate::config::get_config;

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillEntry {
    pub name: String,
    pub is_dir: bool,
    pub last_modified: u64,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillTestResult {
    pub tool_id: String,
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

fn resolve_skill_content_path(path: &str) -> Result<PathBuf, String> {
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

#[tauri::command]
pub fn list_skills(dir: String) -> Result<Vec<SkillEntry>, String> {
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
pub fn open_skills_folder(app: AppHandle) -> Result<(), String> {
    let config = get_config()?;
    let mut storage_path = config.storage_path.clone();
    
    if storage_path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            let mut p = home;
            p.push(&storage_path[2..]);
            storage_path = p.to_string_lossy().to_string();
        }
    }
    
    fs::create_dir_all(&storage_path).ok();
    
    app.shell().open(storage_path, None).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn test_tool_skill(tool_id: String, skill_name: String) -> Result<SkillTestResult, String> {
    let config = get_config()?;
    let tool = config
        .tools
        .get(&tool_id)
        .ok_or_else(|| format!("Tool {} not found", tool_id))?;

    let storage_path = PathBuf::from(&config.storage_path);
    let skill_path = storage_path.join(&skill_name);
    if !skill_path.exists() {
        return Err(format!("Skill {} not found", skill_name));
    }

    let tool_settings = config
        .tool_skill_settings
        .get(&tool_id)
        .and_then(|items| items.get(&skill_name))
        .cloned()
        .unwrap_or_default();

    let resolved_path = resolve_skill_content_path(&skill_path.to_string_lossy())?;
    let content = fs::read_to_string(resolved_path).map_err(|e| e.to_string())?;
    let line_count = content.lines().count();
    let message = format!(
        "{} 已通过测试：文件可读取，共 {} 行，优先级 {}，参数 {} 个。",
        tool.name,
        line_count,
        tool_settings.priority,
        tool_settings.parameters.len()
    );

    Ok(SkillTestResult {
        tool_id,
        skill_name,
        status: "success".to_string(),
        message,
        priority: tool_settings.priority,
        parameter_count: tool_settings.parameters.len(),
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
}
