import { invoke } from "@tauri-apps/api/core";
import * as mockApi from "./mockApi";

export interface AgentSkillSettings {
  enabled: boolean;
  priority: number;
  parameters: Record<string, string>;
}

export interface AgentConfig {
  name: string;
  target_dir: string;
  config_path: string;
  description: string;
  icon: string;
  tags: string[];
  enabled: boolean;
}

export interface AppConfig {
  config_version: number;
  storage_path: string;
  agents: Record<string, AgentConfig>;
  links: Record<string, string[]>;
  agent_skill_settings: Record<string, Record<string, AgentSkillSettings>>;
}

export interface SkillEntry {
  name: string;
  is_dir: boolean;
  last_modified: number;
  path: string;
  description: string;
}

export interface MarketplaceListing {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  download_count: number;
  source: string;
  content?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  count: number;
}

export interface MarketplaceListingsResponse {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  page_size: number;
}

const isTauriEnvironment =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const api = isTauriEnvironment
  ? {
      getConfig: () => invoke<AppConfig>("get_config"),
      saveConfig: (config: AppConfig) => invoke<void>("save_config", { config }),
      listSkills: (dir: string) => invoke<SkillEntry[]>("list_skills", { dir }),
      readSkillFile: (path: string) => invoke<string>("read_skill_file", { path }),
      writeSkillFile: (path: string, content: string) =>
        invoke<void>("write_skill_file", { path, content }),
      deleteSkill: (path: string) => invoke<void>("delete_skill", { path }),
      toggleLink: (skillName: string, agentId: string, enable: boolean) =>
        invoke<void>("toggle_link", { skillName, agentId, enable }),
      syncAll: () => invoke<void>("sync_all"),
      // Marketplace APIs
      getMarketplaceListings: (page?: number, pageSize?: number, category?: string, search?: string) =>
        invoke<MarketplaceListingsResponse>("get_marketplace_listings", { page, pageSize, category, search }),
      getFeaturedListings: () => invoke<MarketplaceListing[]>("get_featured_marketplace_listings"),
      getMarketplaceCategories: () => invoke<MarketplaceCategory[]>("get_marketplace_categories"),
      getMarketplaceListingDetail: (id: string) => invoke<MarketplaceListing>("get_marketplace_listing_detail", { id }),
      downloadMarketplaceSkill: (id: string, storagePath: string, description?: string) =>
        invoke<string>("download_marketplace_skill", { id, storagePath, description }),
    }
  : mockApi;

export const getConfig = () => api.getConfig();
export const saveConfig = (config: AppConfig) => api.saveConfig(config);
export const listSkills = (dir: string) => api.listSkills(dir);
export const readSkillFile = (path: string) => api.readSkillFile(path);
export const writeSkillFile = (path: string, content: string) =>
  api.writeSkillFile(path, content);
export const deleteSkill = (path: string) => api.deleteSkill(path);
export const toggleLink = (skillName: string, agentId: string, enable: boolean) =>
  api.toggleLink(skillName, agentId, enable);
export const syncAll = () => api.syncAll();

// Marketplace exports
export const getMarketplaceListings = (page?: number, pageSize?: number, category?: string, search?: string) =>
  api.getMarketplaceListings(page, pageSize, category, search);
export const getFeaturedListings = () => api.getFeaturedListings();
export const getMarketplaceCategories = () => api.getMarketplaceCategories();
export const getMarketplaceListingDetail = (id: string) => api.getMarketplaceListingDetail(id);
export const downloadMarketplaceSkill = (id: string, storagePath: string, description?: string) =>
  api.downloadMarketplaceSkill(id, storagePath, description);
