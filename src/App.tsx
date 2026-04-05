import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { SkillsView } from "./views/SkillsView";
import { AgentsView } from "./views/AgentsView";
import { MarketplaceView } from "./views/MarketplaceView";
import { SkillEntry, readSkillFile } from "./lib/api";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  clearNotice,
  deleteSkillEntry,
  loadWorkspace,
  persistWorkspaceConfig,
  saveSkillEntry,
  setActiveView,
  setNotice,
} from "./store/workspaceSlice";

const i18n = {
  zh: {
    appTitle: "Skills Manager",
    sidebarHint: "统一管理你的 agents 与 skills",
    skills: "Skills",
    agents: "Agents",
    marketplace: "技能市场",
    refresh: "刷新",
    refreshSuccess: "刷新成功",
    loading: "加载中...",
    language: "语言",
    role: "角色",
    admin: "管理员",
    editor: "编辑者",
    viewer: "访客",
    newSkill: "新增 Skill",
    searchSkills: "搜索 skill 名称",
    searchAgents: "搜索 agent 名称",
    save: "保存",
    saving: "保存中...",
    cancel: "取消",
    edit: "编辑",
    delete: "删除",
    createSkill: "创建 Skill",
    skillNamePlaceholder: "例如：review_pr.md",
    editSkill: "编辑 Skill",
    noSkillsFound: "当前没有匹配的 skill。",
    agentsHint: "查看和管理所有的 agents 及其对应的 skills 和配置信息。",
    addAgent: "新增 Agent",
    allTags: "全部标签",
    disabled: "已停用",
    configureSkill: "配置 Skill",
    skillsPath: "Skills Path",
    skillsPathRequired: "Skills Path 不能为空",
    skillsPathHint: "必填，默认：~/.<agent-id>/skills",
    notConfigured: "未配置",
    noAgentsFound: "没有匹配的 agent。",
    agentId: "Agent ID",
    agentName: "Agent 名称",
    agentNameRequired: "Agent 名称不能为空",
    description: "简要描述",
    icon: "图标",
    iconPlaceholder: "选择上方图标或输入 Lucide 图标名",
    tags: "标签",
    tagsPlaceholder: "用逗号分隔，例如：cli, agent",
    enabled: "启用此 Agent",
    invalidAgentId: "Agent ID 只能包含字母、数字、下划线和连字符",
    duplicateAgentId: "Agent ID 已存在",
    createAgent: "新增 Agent",
    editAgent: "编辑 Agent",
    agentSaved: "Agent 已保存并同步",
    agentDeleted: "Agent 已删除",
    confirmDeleteAgent: "确定删除 {agent} 吗？",
    skillAssociations: "个 Skill 关联",
    skillConfigTitle: "配置 {agent} 的 Skill",
    skillConfigHint: "管理当前 agent 的 skill 关联、参数与优先级。",
    selectSkill: "选择一个 Skill",
    addSkill: "添加 Skill",
    priority: "优先级",
    parameters: "参数",
    priorityHint: "优先级越高，表示在该 agent 下越优先使用。",
    parameterFormatError: "参数必须是合法 JSON 对象",
    testSkill: "测试 Skill",
    testHint: "点击测试按钮验证该 skill 是否可用。",
    saveSkillConfig: "保存配置",
    skillConfigSaved: "Skill 配置已保存",
    noSkillConfig: "当前还没有关联的 skill。",
    linkedSkills: "已关联 Skill",
    availableSkills: "可添加 Skill",
    searchLinkedSkills: "搜索已关联的 skill",
    searchAvailableSkills: "搜索可添加的 skill",
    noAvailableSkills: "没有可添加的 skill。",
    noLinkedSkillsMatched: "没有匹配的已关联 skill。",
    skillDescriptionFallback: "暂无描述，打开文件后可查看完整内容。",
    clickToEditPath: "点击可编辑路径",
    pathSavedThroughEdit: "通过编辑 Agent 可修改路径",
    directory: "目录",
    file: "文件",
    marketplacePlaceholder: "从社区发现和安装新的 skills",
    skillCreated: "Skill 已创建",
    skillDeleted: "Skill 已删除",
    skillSaved: "Skill 已保存",
    marketplaceHint: "浏览和安装社区共享的 skills",
    searchMarketplace: "搜索你想要的技能...",
    featured: "精选推荐",
    allCategories: "全部分类",
    viewDetail: "查看详情",
    install: "安装",
    download: "下载",
    back: "返回",
    skillContent: "Skill 内容预览",
    noListingsFound: "没有找到匹配的 skill 列表",
    previous: "上一页",
    next: "下一页",
    downloadSuccess: "Skill 下载成功",
  },
  en: {
    appTitle: "Skills Manager",
    sidebarHint: "Manage your agents and skills in one place",
    skills: "Skills",
    agents: "Agents",
    marketplace: "Marketplace",
    refresh: "Refresh",
    refreshSuccess: "Refreshed",
    loading: "Loading...",
    language: "Language",
    role: "Role",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
    newSkill: "New Skill",
    searchSkills: "Search skills",
    searchAgents: "Search agents by name",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    createSkill: "Create Skill",
    skillNamePlaceholder: "For example: review_pr.md",
    editSkill: "Edit Skill",
    noSkillsFound: "No matching skills found.",
    agentsHint: "View and manage all agents, their skills, and configuration info.",
    addAgent: "Add Agent",
    allTags: "All Tags",
    disabled: "Disabled",
    configureSkill: "Configure Skill",
    skillsPath: "Skills Path",
    skillsPathRequired: "Skills Path is required",
    skillsPathHint: "Required. Default: ~/.<agent-id>/skills",
    notConfigured: "Not configured",
    noAgentsFound: "No matching agents found.",
    agentId: "Agent ID",
    agentName: "Agent Name",
    agentNameRequired: "Agent name is required",
    description: "Description",
    icon: "Icon",
    iconPlaceholder: "Select above or enter Lucide icon name",
    tags: "Tags",
    tagsPlaceholder: "Comma separated, for example: cli, agent",
    enabled: "Enable this agent",
    invalidAgentId: "Agent ID may only contain letters, numbers, underscores and hyphens",
    duplicateAgentId: "Agent ID already exists",
    createAgent: "Create Agent",
    editAgent: "Edit Agent",
    agentSaved: "Agent saved and synced",
    agentDeleted: "Agent deleted",
    confirmDeleteAgent: "Delete {agent}?",
    skillAssociations: "skill associations",
    skillConfigTitle: "Configure skills for {agent}",
    skillConfigHint: "Manage linked skills, parameters, and priorities for this agent.",
    selectSkill: "Select a skill",
    addSkill: "Add Skill",
    priority: "Priority",
    parameters: "Parameters",
    priorityHint: "Higher values make a skill more preferred for this agent.",
    parameterFormatError: "Parameters must be a valid JSON object",
    testSkill: "Test Skill",
    testHint: "Run a quick validation for this skill.",
    saveSkillConfig: "Save Configuration",
    skillConfigSaved: "Skill configuration saved",
    noSkillConfig: "No skills linked to this agent yet.",
    linkedSkills: "Linked Skills",
    availableSkills: "Available Skills",
    searchLinkedSkills: "Search linked skills",
    searchAvailableSkills: "Search available skills",
    noAvailableSkills: "No skills available to add.",
    noLinkedSkillsMatched: "No linked skills match the search.",
    skillDescriptionFallback: "No description available yet. Open the file to inspect full content.",
    clickToEditPath: "Click to edit path",
    pathSavedThroughEdit: "Edit the agent to update paths",
    directory: "Directory",
    file: "File",
    skillCreated: "Skill created",
    skillDeleted: "Skill deleted",
    skillSaved: "Skill saved",
    marketplaceHint: "Browse and install community-shared skills",
    searchMarketplace: "Search the skills you want...",
    featured: "Featured",
    allCategories: "All Categories",
    viewDetail: "View Detail",
    install: "Install",
    download: "Download",
    back: "Back",
    skillContent: "Skill Content Preview",
    noListingsFound: "No matching listings found",
    previous: "Previous",
    next: "Next",
    downloadSuccess: "Skill downloaded successfully",
  },
};

type Lang = "zh" | "en";

export default function App() {
  const dispatch = useAppDispatch();
  const { activeView, config, error, loading, notice, saving, skills } =
    useAppSelector((state) => state.workspace);
  const [lang, setLang] = useState<Lang>("zh");
  const labels = i18n[lang];

  useEffect(() => {
    void dispatch(loadWorkspace());
  }, [dispatch]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch(clearNotice());
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [dispatch, notice]);

  const overview = useMemo(
    () => ({
      agentCount: config ? Object.keys(config.agents).length : 0,
      skillCount: skills.length,
      linkCount: config ? Object.values(config.links).reduce((sum, items) => sum + items.length, 0) : 0,
    }),
    [config, skills.length]
  );

  const handleDeleteSkill = async (skill: SkillEntry) => {
    try {
      await dispatch(
        deleteSkillEntry({
          path: skill.path,
          successMessage: labels.skillDeleted,
        })
      ).unwrap();
    } catch (e) {
      console.error("Delete failed in App.tsx:", e);
      dispatch(setNotice({ type: "error", message: `${labels.delete} failed: ${String(e)}` }));
    }
  };

  const handleSaveSkill = async (skill: SkillEntry, content: string) => {
    await dispatch(
      saveSkillEntry({
        path: skill.path,
        content,
        successMessage: labels.skillSaved,
      })
    ).unwrap();
  };

  if (loading && !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">{labels.loading}</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Skills Manager</h1>
          <p className="mt-3 text-sm text-red-600">{error || "Failed to load workspace"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900">
      {notice && (
        <div className="fixed left-1/2 top-5 z-[70] -translate-x-1/2">
          <div
            className={`rounded-2xl border px-6 py-3 text-sm font-medium shadow-lg text-center ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.message}
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar
          activeView={activeView}
          labels={labels}
          onSelect={(view) => {
            dispatch(setActiveView(view));
          }}
          overview={overview}
          storagePath={config.storage_path}
        />

        <main className="flex-1 p-4 md:p-6">
          <header className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLang("en")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  lang === "en" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                EN
              </button>
              <span className="text-gray-300">/</span>
              <button
                onClick={() => setLang("zh")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  lang === "zh" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                中文
              </button>
            </div>
          </header>

          <div>
            {activeView === "skills" && (
              <SkillsView
                labels={labels}
                storagePath={config.storage_path}
                skills={skills}
                saving={saving}
                onRefresh={async () => {
                  await dispatch(loadWorkspace()).unwrap();
                  dispatch(setNotice({ type: "success", message: labels.refreshSuccess || "刷新成功" }));
                }}
                onDeleteSkill={handleDeleteSkill}
                onReadSkill={async (path) => {
                  try {
                    return await readSkillFile(path);
                  } catch (e) {
                    dispatch(loadWorkspace()); // reload in case file is missing
                    throw e;
                  }
                }}
                onSaveSkill={handleSaveSkill}
                onNavigateToMarketplace={() => dispatch(setActiveView("marketplace"))}
              />
            )}

            {activeView === "agents" && (
              <AgentsView
                labels={labels}
                config={config}
                skills={skills}
                saving={saving}
                onRefresh={async () => {
                  await dispatch(loadWorkspace()).unwrap();
                  dispatch(setNotice({ type: "success", message: labels.refreshSuccess || "刷新成功" }));
                }}
                onPersistConfig={(nextConfig, successMessage) =>
                  void dispatch(persistWorkspaceConfig({ config: nextConfig, successMessage }))
                }
              />
            )}

            {activeView === "marketplace" && (
              <MarketplaceView
                labels={labels}
                storagePath={config?.storage_path || ""}
                skills={skills}
                onRefresh={async () => {
                  await dispatch(loadWorkspace()).unwrap();
                  dispatch(setNotice({ type: "success", message: labels.refreshSuccess || "刷新成功" }));
                }}
                onDownloadSuccess={(msg?: string) => {
                  void dispatch(loadWorkspace());
                  if (msg) {
                    dispatch(setNotice({ type: "success", message: msg }));
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
