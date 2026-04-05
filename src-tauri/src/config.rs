use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

fn default_enabled() -> bool {
    true
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Agent {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub target_dir: String,
    #[serde(default)]
    pub config_path: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub icon: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentSkillSettings {
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default)]
    pub priority: i32,
    #[serde(default)]
    pub parameters: HashMap<String, String>,
}

impl Default for AgentSkillSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            priority: 0,
            parameters: HashMap::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    #[serde(default)]
    pub config_version: u32,
    pub storage_path: String,
    pub agents: HashMap<String, Agent>,
    pub links: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub agent_skill_settings: HashMap<String, HashMap<String, AgentSkillSettings>>,
}

const CURRENT_CONFIG_VERSION: u32 = 1;

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

pub fn get_config_path() -> PathBuf {
    let mut path = dirs::home_dir().unwrap_or_else(|| PathBuf::from("~"));
    path.push(".skills-manager");
    fs::create_dir_all(&path).ok();
    path.push("config.json");
    path
}

fn default_agents() -> HashMap<String, Agent> {
    let mut agents = HashMap::new();
    agents.insert(
        "claude".to_string(),
        Agent {
            name: "Claude Code".to_string(),
            target_dir: expand_tilde("~/.claude/skills"),
            config_path: expand_tilde("~/.claude"),
            description: "面向 Claude Code 的默认 skills 目录。".to_string(),
            icon: "Bot".to_string(),
            tags: vec!["assistant".to_string(), "cli".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "codex".to_string(),
        Agent {
            name: "Codex".to_string(),
            target_dir: expand_tilde("~/.codex/skills"),
            config_path: expand_tilde("~/.codex"),
            description: "用于 Codex 的本地 skills 管理。".to_string(),
            icon: "Code2".to_string(),
            tags: vec!["assistant".to_string(), "cli".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "opencode".to_string(),
        Agent {
            name: "Opencode".to_string(),
            target_dir: expand_tilde("~/.opencode/skills"),
            config_path: expand_tilde("~/.opencode"),
            description: "适配 Opencode 的共享技能目录。".to_string(),
            icon: "Boxes".to_string(),
            tags: vec!["assistant".to_string(), "cli".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "cursor".to_string(),
        Agent {
            name: "Cursor".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "Cursor 编辑器的技能与代理能力入口。".to_string(),
            icon: "PanelLeft".to_string(),
            tags: vec!["editor".to_string(), "agent".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "windsurf".to_string(),
        Agent {
            name: "Windsurf".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "Windsurf 开发环境的agent与技能接入。".to_string(),
            icon: "Wind".to_string(),
            tags: vec!["editor".to_string(), "agent".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "cline".to_string(),
        Agent {
            name: "Cline".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "为 Cline 准备的可配置agent卡片。".to_string(),
            icon: "Wrench".to_string(),
            tags: vec!["extension".to_string(), "agent".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "continue".to_string(),
        Agent {
            name: "Continue".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "Continue 插件的上下文与技能管理。".to_string(),
            icon: "Workflow".to_string(),
            tags: vec!["extension".to_string(), "editor".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "aider".to_string(),
        Agent {
            name: "Aider".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "Aider 终端协作编程agent。".to_string(),
            icon: "TerminalSquare".to_string(),
            tags: vec!["cli".to_string(), "agent".to_string()],
            enabled: true,
        },
    );
    agents.insert(
        "gemini".to_string(),
        Agent {
            name: "Gemini CLI".to_string(),
            target_dir: String::new(),
            config_path: String::new(),
            description: "Gemini CLI 的agent与技能接入位。".to_string(),
            icon: "Sparkles".to_string(),
            tags: vec!["assistant".to_string(), "cli".to_string()],
            enabled: true,
        },
    );
    agents
}

fn create_default_config() -> AppConfig {
    let storage_path = expand_tilde("~/.skills-manager/skills");
    AppConfig {
        config_version: CURRENT_CONFIG_VERSION,
        storage_path,
        agents: default_agents(),
        links: HashMap::new(),
        agent_skill_settings: HashMap::new(),
    }
}

fn merge_default_agents(mut config: AppConfig) -> AppConfig {
    for (agent_id, agent) in default_agents() {
        config.agents.entry(agent_id).or_insert(agent);
    }
    config
}

fn migrate_config(mut config: AppConfig) -> AppConfig {
    if config.config_version < CURRENT_CONFIG_VERSION {
        config = merge_default_agents(config);
    }
    config.config_version = CURRENT_CONFIG_VERSION;
    config
}

fn is_valid_agent_id(agent_id: &str) -> bool {
    !agent_id.is_empty()
        && agent_id
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-')
}

fn normalize_links(
    links: HashMap<String, Vec<String>>,
    agents: &HashMap<String, Agent>,
) -> HashMap<String, Vec<String>> {
    let mut normalized = HashMap::new();

    for (skill_name, agent_ids) in links {
        let mut filtered = Vec::new();
        for agent_id in agent_ids {
            if agents.contains_key(&agent_id) && !filtered.contains(&agent_id) {
                filtered.push(agent_id);
            }
        }

        if !filtered.is_empty() {
            normalized.insert(skill_name, filtered);
        }
    }

    normalized
}

fn normalize_agent_skill_settings(
    agent_skill_settings: HashMap<String, HashMap<String, AgentSkillSettings>>,
    agents: &HashMap<String, Agent>,
    links: &HashMap<String, Vec<String>>,
) -> HashMap<String, HashMap<String, AgentSkillSettings>> {
    let mut normalized = HashMap::new();

    for (agent_id, skill_settings) in agent_skill_settings {
        if !agents.contains_key(&agent_id) {
            continue;
        }

        let mut per_agent = HashMap::new();
        for (skill_name, settings) in skill_settings {
            let is_linked = links
                .get(&skill_name)
                .map(|agent_ids| agent_ids.contains(&agent_id))
                .unwrap_or(false);
            if is_linked {
                per_agent.insert(
                    skill_name,
                    AgentSkillSettings {
                        enabled: settings.enabled,
                        priority: settings.priority,
                        parameters: settings.parameters,
                    },
                );
            }
        }

        if !per_agent.is_empty() {
            normalized.insert(agent_id, per_agent);
        }
    }

    normalized
}

fn normalize_config(config: AppConfig) -> Result<AppConfig, String> {
    let storage_path = expand_tilde(config.storage_path.trim());
    if storage_path.is_empty() {
        return Err("Storage path cannot be empty".to_string());
    }

    fs::create_dir_all(&storage_path).map_err(|e| e.to_string())?;

    let mut agents = HashMap::new();
    for (agent_id, agent) in config.agents {
        let normalized_agent_id = agent_id.trim().to_string();
        if !is_valid_agent_id(&normalized_agent_id) {
            return Err(format!("Invalid agent id: {}", agent_id));
        }

        let target_dir = if agent.target_dir.trim().is_empty() {
            String::new()
        } else {
            expand_tilde(agent.target_dir.trim())
        };

        agents.insert(
            normalized_agent_id.clone(),
            Agent {
                name: if agent.name.trim().is_empty() {
                    normalized_agent_id
                } else {
                    agent.name.trim().to_string()
                },
                target_dir,
                config_path: if agent.config_path.trim().is_empty() {
                    String::new()
                } else {
                    expand_tilde(agent.config_path.trim())
                },
                description: agent.description.trim().to_string(),
                icon: if agent.icon.trim().is_empty() {
                    "Bot".to_string()
                } else {
                    agent.icon.trim().to_string()
                },
                tags: {
                    let mut tags = Vec::new();
                    for tag in agent.tags {
                        let tag = tag.trim().to_string();
                        if !tag.is_empty() && !tags.contains(&tag) {
                            tags.push(tag);
                        }
                    }
                    tags.sort_by(|left, right| left.to_lowercase().cmp(&right.to_lowercase()));
                    tags
                },
                enabled: agent.enabled,
            },
        );
    }

    let links = normalize_links(config.links, &agents);
    let agent_skill_settings =
        normalize_agent_skill_settings(config.agent_skill_settings, &agents, &links);

    Ok(AppConfig {
        config_version: CURRENT_CONFIG_VERSION,
        storage_path,
        agents,
        links,
        agent_skill_settings,
    })
}

fn is_managed_symlink(link_path: &Path, storage_path: &Path) -> bool {
    fs::read_link(link_path)
        .ok()
        .map(|target| target.starts_with(storage_path))
        .unwrap_or(false)
}

fn remove_link_path(path: &Path) -> Result<(), String> {
    fs::remove_file(path)
        .or_else(|_| fs::remove_dir(path))
        .map_err(|e| e.to_string())
}

fn cleanup_removed_agent_links(previous: &AppConfig, current: &AppConfig) -> Result<(), String> {
    let storage_path = PathBuf::from(&current.storage_path);

    for (agent_id, agent) in &previous.agents {
        if current.agents.contains_key(agent_id) {
            continue;
        }

        if agent.target_dir.trim().is_empty() {
            continue;
        }

        let target_dir = PathBuf::from(expand_tilde(&agent.target_dir));
        if !target_dir.exists() {
            continue;
        }

        for entry in fs::read_dir(&target_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let link_path = entry.path();
            let metadata = fs::symlink_metadata(&link_path).map_err(|e| e.to_string())?;
            if metadata.file_type().is_symlink() && is_managed_symlink(&link_path, &storage_path) {
                remove_link_path(&link_path)?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_config() -> Result<AppConfig, String> {
    let config_path = get_config_path();
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                let normalized = migrate_config(normalize_config(config)?);
                let normalized_content =
                    serde_json::to_string_pretty(&normalized).map_err(|e| e.to_string())?;
                if normalized_content != content {
                    fs::write(&config_path, normalized_content).map_err(|e| e.to_string())?;
                }
                return Ok(normalized);
            }
        }
    }

    let config = migrate_config(normalize_config(create_default_config())?);
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, content).map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub fn save_config(config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path();
    let previous_config = if config_path.exists() {
        fs::read_to_string(&config_path)
            .ok()
            .and_then(|content| serde_json::from_str::<AppConfig>(&content).ok())
            .and_then(|value| normalize_config(value).ok())
    } else {
        None
    };

    let normalized = normalize_config(config)?;

    if let Some(previous) = previous_config {
        cleanup_removed_agent_links(&previous, &normalized)?;
    }

    let content = serde_json::to_string_pretty(&normalized).map_err(|e| e.to_string())?;
    fs::write(&config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(name: &str) -> String {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir()
            .join(format!("skills-manager-{}-{}", name, nanos))
            .to_string_lossy()
            .to_string()
    }

    #[test]
    fn merge_default_agents_adds_common_agents() {
        let config = AppConfig {
            config_version: CURRENT_CONFIG_VERSION,
            storage_path: unique_temp_dir("merge-defaults"),
            agents: HashMap::new(),
            links: HashMap::new(),
            agent_skill_settings: HashMap::new(),
        };

        let merged = merge_default_agents(config);

        assert!(merged.agents.contains_key("claude"));
        assert!(merged.agents.contains_key("codex"));
        assert!(merged.agents.contains_key("opencode"));
        assert!(merged.agents.contains_key("cursor"));
        assert!(merged.agents.contains_key("windsurf"));
        assert!(merged.agents.contains_key("cline"));
        assert!(merged.agents.contains_key("continue"));
        assert!(merged.agents.contains_key("aider"));
        assert!(merged.agents.contains_key("gemini"));
    }

    #[test]
    fn normalize_config_allows_unconfigured_agent_target_dir() {
        let mut agents = HashMap::new();
        agents.insert(
            "cursor".to_string(),
            Agent {
                name: "Cursor".to_string(),
                target_dir: String::new(),
                config_path: String::new(),
                description: String::new(),
                icon: "Bot".to_string(),
                tags: Vec::new(),
                enabled: true,
            },
        );

        let config = AppConfig {
            config_version: CURRENT_CONFIG_VERSION,
            storage_path: unique_temp_dir("normalize"),
            agents,
            links: HashMap::new(),
            agent_skill_settings: HashMap::new(),
        };

        let normalized = normalize_config(config).unwrap();

        assert_eq!(normalized.agents.get("cursor").unwrap().target_dir, "");
    }

    #[test]
    fn migrate_config_only_backfills_old_configs() {
        let old_config = AppConfig {
            config_version: 0,
            storage_path: unique_temp_dir("migrate-old"),
            agents: HashMap::new(),
            links: HashMap::new(),
            agent_skill_settings: HashMap::new(),
        };

        let migrated = migrate_config(old_config);

        assert!(migrated.agents.contains_key("cursor"));
        assert_eq!(migrated.config_version, CURRENT_CONFIG_VERSION);

        let current_config = AppConfig {
            config_version: CURRENT_CONFIG_VERSION,
            storage_path: unique_temp_dir("migrate-current"),
            agents: HashMap::from([(
                "custom".to_string(),
                Agent {
                    name: "Custom".to_string(),
                    target_dir: String::new(),
                    config_path: String::new(),
                    description: String::new(),
                    icon: "Bot".to_string(),
                    tags: Vec::new(),
                    enabled: true,
                },
            )]),
            links: HashMap::new(),
            agent_skill_settings: HashMap::new(),
        };

        let migrated_current = migrate_config(current_config);

        assert!(migrated_current.agents.contains_key("custom"));
        assert!(!migrated_current.agents.contains_key("cursor"));
    }
}
