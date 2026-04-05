use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[cfg(unix)]
use std::os::unix::fs::symlink;

#[cfg(windows)]
use std::os::windows::fs::{symlink_dir, symlink_file};

use crate::config::{get_config, save_config};

fn expand_tilde(path: &str) -> String {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            let mut p = home;
            p.push(&path[2..]);
            return p.to_string_lossy().to_string();
        }
    }
    path.to_string()
}

fn create_symlink(src: &Path, dst: &Path) -> Result<(), String> {
    if let Ok(meta) = fs::symlink_metadata(dst) {
        if meta.file_type().is_symlink() {
            remove_existing_link(dst)?;
        } else if meta.is_dir() {
            fs::remove_dir_all(dst).map_err(|e| e.to_string())?;
        } else {
            fs::remove_file(dst).map_err(|e| e.to_string())?;
        }
    }

    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    #[cfg(unix)]
    {
        symlink(src, dst).map_err(|e| e.to_string())
    }

    #[cfg(windows)]
    {
        if src.is_dir() {
            symlink_dir(src, dst).map_err(|e| e.to_string())
        } else {
            symlink_file(src, dst).map_err(|e| e.to_string())
        }
    }
}

fn remove_existing_link(dst: &Path) -> Result<(), String> {
    fs::remove_file(dst)
        .or_else(|_| fs::remove_dir(dst))
        .map_err(|e| e.to_string())
}

fn remove_symlink(dst: &Path) -> Result<(), String> {
    if let Ok(meta) = fs::symlink_metadata(dst) {
        if meta.file_type().is_symlink() {
            remove_existing_link(dst)?;
        }
    }
    Ok(())
}

fn list_storage_skill_names(storage_path: &Path) -> Result<HashSet<String>, String> {
    let mut skill_names = HashSet::new();

    if !storage_path.exists() {
        fs::create_dir_all(storage_path).map_err(|e| e.to_string())?;
    }

    for entry in fs::read_dir(storage_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Ok(name) = entry.file_name().into_string() {
            if !name.starts_with('.') {
                skill_names.insert(name);
            }
        }
    }

    Ok(skill_names)
}

fn cleanup_target_dir(
    target_dir: &Path,
    storage_path: &Path,
    expected_skill_names: &HashSet<String>,
) -> Result<(), String> {
    if !target_dir.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(target_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let link_path = entry.path();
        let metadata = fs::symlink_metadata(&link_path).map_err(|e| e.to_string())?;
        if !metadata.file_type().is_symlink() {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy().to_string();
        let target = match fs::read_link(&link_path) {
            Ok(target) => target,
            Err(_) => {
                remove_existing_link(&link_path)?;
                continue;
            }
        };

        if !target.starts_with(storage_path) || expected_skill_names.contains(&file_name) {
            continue;
        }

        remove_existing_link(&link_path)?;
    }

    Ok(())
}

#[tauri::command]
pub fn toggle_link(skill_name: String, agent_id: String, enable: bool) -> Result<(), String> {
    let mut config = get_config()?;
    
    let links = config.links.entry(skill_name.clone()).or_insert_with(Vec::new);
    if enable {
        if !links.contains(&agent_id) {
            links.push(agent_id.clone());
        }
    } else {
        links.retain(|t| t != &agent_id);
    }
    
    let storage_path = PathBuf::from(expand_tilde(&config.storage_path));
    let skill_path = storage_path.join(&skill_name);
    
    if let Some(agent) = config.agents.get(&agent_id) {
        if !agent.enabled {
            return Err(format!("Agent {} is disabled", agent_id));
        }

        if agent.target_dir.trim().is_empty() {
            return Err(format!("Agent {} target directory is not configured", agent_id));
        }

        let target_dir = PathBuf::from(expand_tilde(&agent.target_dir));
        let dst = target_dir.join(&skill_name);
        
        if enable {
            create_symlink(&skill_path, &dst)?;
        } else {
            remove_symlink(&dst)?;
        }
    }
    
    save_config(config)?;
    
    Ok(())
}

#[tauri::command]
pub fn sync_all() -> Result<(), String> {
    let mut config = get_config()?;
    let storage_path = PathBuf::from(expand_tilde(&config.storage_path));

    let skill_names = list_storage_skill_names(&storage_path)?;
    config
        .links
        .retain(|skill_name, agent_ids| skill_names.contains(skill_name) && !agent_ids.is_empty());

    for (agent_id, agent) in &config.agents {
        let expected_skill_names: HashSet<String> = if agent.enabled && !agent.target_dir.trim().is_empty() {
            skill_names
            .iter()
            .filter(|skill_name| {
                config
                    .links
                    .get(*skill_name)
                    .map(|agent_ids| agent_ids.contains(agent_id))
                    .unwrap_or(false)
            })
            .cloned()
            .collect()
        } else {
            HashSet::new()
        };

        if agent.target_dir.trim().is_empty() {
            continue;
        }

        let target_dir = PathBuf::from(expand_tilde(&agent.target_dir));
        if !target_dir.exists() {
            fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
        }

        cleanup_target_dir(&target_dir, &storage_path, &expected_skill_names)?;

        for skill_name in &expected_skill_names {
            let dst = target_dir.join(skill_name);
            let skill_path = storage_path.join(skill_name);
            create_symlink(&skill_path, &dst)?;
        }

        for skill_name in skill_names.difference(&expected_skill_names) {
            let dst = target_dir.join(skill_name);
            remove_symlink(&dst)?;
        }
    }

    save_config(config)?;

    Ok(())
}
