import type {
  AppConfig,
  MarketplaceCategory,
  MarketplaceListing,
  MarketplaceListingsResponse,
  SkillEntry,
  SkillTestResult,
  ToolConfig,
  ToolSkillSettings,
} from "./api";

const CONFIG_KEY = "skills-manager-mock-config";
const FILES_KEY = "skills-manager-mock-files";
const CURRENT_CONFIG_VERSION = 1;

const createTool = (tool: Partial<ToolConfig> & Pick<ToolConfig, "name">): ToolConfig => ({
  name: tool.name,
  target_dir: tool.target_dir || "",
  config_path: tool.config_path || "",
  description: tool.description || "",
  icon: tool.icon || "Bot",
  tags: tool.tags || [],
  enabled: tool.enabled ?? true,
});

const defaultConfig = (): AppConfig => ({
  config_version: CURRENT_CONFIG_VERSION,
  storage_path: "~/.skills-manager/skills",
  tools: {
    claude: createTool({
      name: "Claude Code",
      target_dir: "/mock/claude/skills",
      config_path: "/mock/claude",
      description: "Claude Code 的默认技能目录。",
      icon: "Bot",
      tags: ["assistant", "cli"],
    }),
    cursor: createTool({
      name: "Cursor",
      config_path: "/mock/cursor",
      description: "Cursor 编辑器的工具能力。",
      icon: "PanelLeft",
      tags: ["editor", "agent"],
    }),
    gemini: createTool({
      name: "Gemini CLI",
      config_path: "/mock/gemini",
      target_dir: "/mock/gemini/skills",
      description: "Gemini CLI 的技能卡片。",
      icon: "Sparkles",
      tags: ["assistant", "cli"],
    }),
  },
  links: {
    "analyze_pr.md": ["claude", "cursor"],
    "summarize_logs.md": ["gemini"],
  },
  tool_skill_settings: {
    claude: {
      "analyze_pr.md": {
        enabled: true,
        priority: 10,
        parameters: {
          depth: "deep",
        },
      },
    },
  },
});

const defaultFiles = () => ({
  "~/.skills-manager/skills/analyze_pr.md": "# Analyze PR\n\nReview pull requests with focus on correctness.",
  "~/.skills-manager/skills/summarize_logs.md": "# Summarize Logs\n\nExtract error summaries from logs.",
  "~/.skills-manager/skills/refactor_plan.md": "# Refactor Plan\n\nGenerate a staged refactor plan.",
});

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getFiles = () => readStorage<Record<string, string>>(FILES_KEY, defaultFiles());

const saveFiles = (files: Record<string, string>) => {
  writeStorage(FILES_KEY, files);
};

const sanitizeConfig = (config: AppConfig): AppConfig => {
  const toolIds = new Set(Object.keys(config.tools));
  const links = Object.fromEntries(
    Object.entries(config.links)
      .map(([skillName, ids]) => [
        skillName,
        ids.filter((toolId, index) => toolIds.has(toolId) && ids.indexOf(toolId) === index),
      ])
      .filter(([, ids]) => ids.length > 0)
  );

  const tool_skill_settings = Object.fromEntries(
    Object.entries(config.tool_skill_settings || {})
      .filter(([toolId]) => toolIds.has(toolId))
      .map(([toolId, settings]) => [
        toolId,
        Object.fromEntries(
          Object.entries(settings).filter(([skillName]) => (links[skillName] || []).includes(toolId))
        ),
      ])
      .filter(([, settings]) => Object.keys(settings).length > 0)
  );

  return {
    ...config,
    config_version: CURRENT_CONFIG_VERSION,
    links,
    tool_skill_settings,
  };
};

const getConfigInternal = (): AppConfig =>
  sanitizeConfig(readStorage<AppConfig>(CONFIG_KEY, defaultConfig()));

const saveConfigInternal = (config: AppConfig) => {
  const normalized = sanitizeConfig(config);
  writeStorage(CONFIG_KEY, normalized);
  return normalized;
};

const pathForName = (storagePath: string, name: string) => `${storagePath}/${name}`;

const listSkillsInternal = (storagePath: string): SkillEntry[] => {
  const files = getFiles();
  return Object.keys(files)
    .filter((path) => path.startsWith(`${storagePath}/`))
    .map((path) => ({
      name: path.split("/").pop() || path,
      is_dir: false,
      last_modified: Date.now(),
      path,
    }))
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" })
    );
};

export const getConfig = async () => getConfigInternal();

export const saveConfig = async (config: AppConfig) => {
  saveConfigInternal(config);
};

export const listSkills = async (dir: string) => listSkillsInternal(dir);

export const readSkillFile = async (path: string) => {
  const files = getFiles();
  if (!(path in files)) {
    throw new Error(`Skill file not found: ${path}`);
  }
  return files[path];
};

export const writeSkillFile = async (path: string, content: string) => {
  const files = getFiles();
  files[path] = content;
  saveFiles(files);
};

export const deleteSkill = async (path: string) => {
  const files = getFiles();
  const skillName = path.split("/").pop();
  delete files[path];
  saveFiles(files);

  if (!skillName) {
    return;
  }

  const config = getConfigInternal();
  delete config.links[skillName];
  for (const toolId of Object.keys(config.tool_skill_settings)) {
    delete config.tool_skill_settings[toolId][skillName];
    if (Object.keys(config.tool_skill_settings[toolId]).length === 0) {
      delete config.tool_skill_settings[toolId];
    }
  }
  saveConfigInternal(config);
};

export const toggleLink = async (skillName: string, toolId: string, enable: boolean) => {
  const config = getConfigInternal();
  const toolIds = config.links[skillName] || [];
  if (enable) {
    if (!toolIds.includes(toolId)) {
      toolIds.push(toolId);
    }
    config.links[skillName] = toolIds;
    config.tool_skill_settings[toolId] = config.tool_skill_settings[toolId] || {};
    config.tool_skill_settings[toolId][skillName] =
      config.tool_skill_settings[toolId][skillName] || ({
        enabled: true,
        priority: 0,
        parameters: {},
      } satisfies ToolSkillSettings);
  } else {
    config.links[skillName] = toolIds.filter((id) => id !== toolId);
    if (config.links[skillName].length === 0) {
      delete config.links[skillName];
    }
    if (config.tool_skill_settings[toolId]) {
      delete config.tool_skill_settings[toolId][skillName];
      if (Object.keys(config.tool_skill_settings[toolId]).length === 0) {
        delete config.tool_skill_settings[toolId];
      }
    }
  }
  saveConfigInternal(config);
};

export const syncAll = async () => {
  const config = getConfigInternal();
  saveConfigInternal(config);
};

export const testToolSkill = async (
  toolId: string,
  skillName: string
): Promise<SkillTestResult> => {
  const config = getConfigInternal();
  const tool = config.tools[toolId];
  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  const path = pathForName(config.storage_path, skillName);
  const files = getFiles();
  const content = files[path];
  if (!content) {
    throw new Error(`Skill not found: ${skillName}`);
  }

  const settings = config.tool_skill_settings[toolId]?.[skillName] || {
    enabled: true,
    priority: 0,
    parameters: {},
  };

  return {
    tool_id: toolId,
    skill_name: skillName,
    status: "success",
    message: `${tool.name} 测试通过，共 ${content.split("\n").length} 行内容。`,
    priority: settings.priority,
    parameter_count: Object.keys(settings.parameters).length,
  };
};

const mockListings: MarketplaceListing[] = [
  {
    id: "volcengine/documentation/volcengine-documentation",
    name: "volcengine-documentation",
    description: "火山引擎官方文档查询工具，支持文档检索和全文获取。涵盖火山引擎全部产品、开发者工具、服务支持、最佳实践。",
    author: "volcengine",
    version: "1.0.0",
    tags: ["document_processing"],
    download_count: 150,
    source: "volcengine",
  },
  {
    id: "volcengine/voice/voice-notify",
    name: "voice-notify",
    description: "使用火山引擎语音服务API，向指定手机号码发送语音通知。",
    author: "volcengine",
    version: "1.0.0",
    tags: ["voice", "notification"],
    download_count: 89,
    source: "volcengine",
  },
  {
    id: "volcengine/rds/volcengine-rds-postgresql",
    name: "volcengine-rds-postgresql",
    description: "可管理火山引擎RDS PostgreSQL实例、进行数据库操作与账号运维，支持脚本调用获取实时结果。",
    author: "volcengine",
    version: "1.0.0",
    tags: ["database", "postgresql"],
    download_count: 234,
    source: "volcengine",
  },
  {
    id: "clawhub/chatbi-skil-test",
    name: "chatbi-skil-test",
    description: "用自然语言就能查询企业数据表，完成数据分析与SQL生成，还能实时跟踪任务流程。",
    author: "clawhub",
    version: "1.0.0",
    tags: ["bi", "sql", "analytics"],
    download_count: 45,
    source: "clawhub",
  },
  {
    id: "clawhub/create-skill-openclaw",
    name: "create-skill-openclaw",
    description: "快速创建符合格式要求的OpenClaw技能相关配置与文件结构。",
    author: "clawhub",
    version: "1.0.0",
    tags: ["openclaw", "generator"],
    download_count: 67,
    source: "clawhub",
  },
  {
    id: "clawhub/workflow-optimizer",
    name: "workflow-optimizer",
    description: "可对AI工作流进行分析，定位运行瓶颈并给出优化方案，自动执行以提升整体效率。",
    author: "clawhub",
    version: "1.0.0",
    tags: ["workflow", "optimization"],
    download_count: 123,
    source: "clawhub",
  },
  {
    id: "clawhub/openclaw-release-monitor",
    name: "openclaw-release-monitor",
    description: "可查看GitHub上OpenClaw的发布说明，展示亮点并将分类变更翻译成用户语言。",
    author: "clawhub",
    version: "1.0.0",
    tags: ["github", "monitoring", "openclaw"],
    download_count: 78,
    source: "clawhub",
  },
  {
    id: "clawhub/aegis-bridge",
    name: "aegis-bridge",
    description: "通过Aegis HTTP/MCP桥编排Claude Code会话，适配编码、PR审查等多代理工作场景。",
    author: "clawhub",
    version: "1.0.0",
    tags: ["aegis", "claude", "mcp"],
    download_count: 156,
    source: "clawhub",
  },
];

const mockCategories: MarketplaceCategory[] = [
  { id: "volcengine", name: "volcengine", count: 3 },
  { id: "clawhub", name: "clawhub", count: 5 },
  { id: "document_processing", name: "document_processing", count: 1 },
  { id: "voice", name: "voice", count: 1 },
  { id: "database", name: "database", count: 1 },
  { id: "bi", name: "bi", count: 1 },
  { id: "openclaw", name: "openclaw", count: 2 },
  { id: "workflow", name: "workflow", count: 1 },
];

export const getMarketplaceListings = async (
  page?: number,
  pageSize?: number,
  category?: string,
  search?: string
): Promise<MarketplaceListingsResponse> => {
  let filtered = [...mockListings];
  if (category && category !== "all") {
    filtered = filtered.filter((l) =>
      l.tags.some((t) => t.toLowerCase().includes(category.toLowerCase()))
    );
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }
  const p = page || 1;
  const ps = pageSize || 20;
  const start = (p - 1) * ps;
  return {
    listings: filtered.slice(start, start + ps),
    total: filtered.length,
    page: p,
    page_size: ps,
  };
};

export const getMarketplaceCategories = async (): Promise<MarketplaceCategory[]> => {
  return mockCategories;
};

export const getMarketplaceListingDetail = async (
  id: string
): Promise<MarketplaceListing> => {
  const listing = mockListings.find((l) => l.id === id);
  if (!listing) {
    throw new Error(`Listing not found: ${id}`);
  }
  return listing;
};

export const downloadMarketplaceSkill = async (
  id: string,
  storagePath: string
): Promise<string> => {
  const listing = mockListings.find((l) => l.id === id);
  if (!listing) {
    throw new Error(`Listing not found: ${id}`);
  }
  const fileName = `${listing.name.toLowerCase().replace(/\s+/g, "-")}.md`;
  return `${storagePath}/${fileName}`;
};

export const getFeaturedListings = async (): Promise<MarketplaceListing[]> => {
  return [...mockListings]
    .sort((a, b) => b.download_count - a.download_count)
    .slice(0, 4);
};
