import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { Sidebar } from "./components/Sidebar";
import { PlaceholderView } from "./views/PlaceholderView";
import { SkillsView } from "./views/SkillsView";
import { ToolsView } from "./views/ToolsView";
import { MarketplaceView } from "./views/MarketplaceView";
import { SkillEntry, readSkillFile } from "./lib/api";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  clearNotice,
  clearSkillTest,
  createSkillEntry,
  deleteSkillEntry,
  loadWorkspace,
  openSkillFolder,
  persistWorkspaceConfig,
  runToolSkillTest,
  saveSkillEntry,
  setActiveView,
  setNotice,
} from "./store/workspaceSlice";

const i18n = {
  zh: {
    appTitle: "Skills Manager",
    sidebarHint: "统一管理你的 tools 与 skills",
    skills: "Skills",
    tools: "Tools",
    marketplace: "Marketplace",
    settings: "Settings",
    feedback: "Feedback",
    refresh: "刷新",
    loading: "加载中...",
    language: "语言",
    role: "角色",
    admin: "管理员",
    editor: "编辑者",
    viewer: "访客",
    openFolder: "打开目录",
    newSkill: "新增 Skill",
    searchSkills: "搜索 skill 名称",
    searchTools: "搜索 tool 名称或标签",
    save: "保存",
    saving: "保存中...",
    cancel: "取消",
    edit: "编辑",
    delete: "删除",
    createSkill: "创建 Skill",
    skillNamePlaceholder: "例如：review_pr.md",
    editSkill: "编辑 Skill",
    noSkillsFound: "当前没有匹配的 skill。",
    toolsHint: "点击左侧 Tools 菜单，在右侧查看和管理所有 tool 卡片。",
    addTool: "新增 Tool",
    allTags: "全部标签",
    disabled: "已停用",
    configureSkill: "配置 Skill",
    configPath: "Config Path",
    skillsPath: "Skills Path",
    notConfigured: "未配置",
    noToolsFound: "没有匹配的 tool。",
    toolId: "Tool ID",
    toolName: "Tool 名称",
    toolNameRequired: "Tool 名称不能为空",
    description: "简要描述",
    icon: "图标标识",
    tags: "标签",
    tagsPlaceholder: "用逗号分隔，例如：cli, agent",
    enabled: "启用该 Tool",
    invalidToolId: "Tool ID 只能包含字母、数字、下划线和连字符",
    duplicateToolId: "Tool ID 已存在",
    createTool: "新增 Tool",
    editTool: "编辑 Tool",
    toolSaved: "Tool 已保存并同步",
    toolDeleted: "Tool 已删除",
    confirmDeleteTool: "确定删除 {tool} 吗？",
    skillAssociations: "个 Skill 关联",
    skillConfigTitle: "配置 {tool} 的 Skill",
    skillConfigHint: "管理当前 tool 的 skill 关联、参数与优先级。",
    selectSkill: "选择一个 Skill",
    addSkill: "添加 Skill",
    priority: "优先级",
    parameters: "参数",
    priorityHint: "优先级越高，表示在该 tool 下越优先使用。",
    parameterFormatError: "参数必须是合法 JSON 对象",
    testSkill: "测试 Skill",
    testHint: "点击测试按钮验证该 skill 是否可用。",
    saveSkillConfig: "保存配置",
    skillConfigSaved: "Skill 配置已保存",
    noSkillConfig: "当前还没有关联的 skill。",
    linkedSkills: "已关联 Skills",
    availableSkills: "可添加 Skills",
    searchLinkedSkills: "搜索已关联的 skill",
    searchAvailableSkills: "搜索可添加的 skill",
    noAvailableSkills: "没有可添加的 skill。",
    noLinkedSkillsMatched: "没有匹配的已关联 skill。",
    clickToEditPath: "点击可编辑路径",
    pathOptional: "可选，不填时保持未配置",
    pathSavedThroughEdit: "通过编辑 Tool 可修改路径",
    directory: "目录",
    file: "文件",
    marketplacePlaceholder: "从社区发现和安装新的 skills",
    settingsPlaceholder: "设置中心后续可继续承接全局首选项、目录扫描与权限策略。",
    feedbackPlaceholder: "反馈中心后续可接入问题反馈、建议收集与诊断信息上报。",
    skillCreated: "Skill 已创建",
    skillDeleted: "Skill 已删除",
    skillSaved: "Skill 已保存",
    folderOpened: "已打开 Skill 目录",
    marketplaceHint: "浏览和安装社区共享的 skills",
    searchMarketplace: "搜索 marketplace...",
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
    sidebarHint: "Manage your tools and skills in one place",
    skills: "Skills",
    tools: "Tools",
    marketplace: "Marketplace",
    settings: "Settings",
    feedback: "Feedback",
    refresh: "Refresh",
    loading: "Loading...",
    language: "Language",
    role: "Role",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
    openFolder: "Open Folder",
    newSkill: "New Skill",
    searchSkills: "Search skills",
    searchTools: "Search tools by name or tag",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    createSkill: "Create Skill",
    skillNamePlaceholder: "For example: review_pr.md",
    editSkill: "Edit Skill",
    noSkillsFound: "No matching skills found.",
    toolsHint: "Click the Tools item in the left navigation to manage all tool cards here.",
    addTool: "Add Tool",
    allTags: "All Tags",
    disabled: "Disabled",
    configureSkill: "Configure Skill",
    configPath: "Config Path",
    skillsPath: "Skills Path",
    notConfigured: "Not configured",
    noToolsFound: "No matching tools found.",
    toolId: "Tool ID",
    toolName: "Tool Name",
    toolNameRequired: "Tool name is required",
    description: "Description",
    icon: "Icon Key",
    tags: "Tags",
    tagsPlaceholder: "Comma separated, for example: cli, agent",
    enabled: "Enable this tool",
    invalidToolId: "Tool ID may only contain letters, numbers, underscores and hyphens",
    duplicateToolId: "Tool ID already exists",
    createTool: "Create Tool",
    editTool: "Edit Tool",
    toolSaved: "Tool saved and synced",
    toolDeleted: "Tool deleted",
    confirmDeleteTool: "Delete {tool}?",
    skillAssociations: "skill associations",
    skillConfigTitle: "Configure skills for {tool}",
    skillConfigHint: "Manage linked skills, parameters, and priorities for this tool.",
    selectSkill: "Select a skill",
    addSkill: "Add Skill",
    priority: "Priority",
    parameters: "Parameters",
    priorityHint: "Higher values make a skill more preferred for this tool.",
    parameterFormatError: "Parameters must be a valid JSON object",
    testSkill: "Test Skill",
    testHint: "Run a quick validation for this skill.",
    saveSkillConfig: "Save Configuration",
    skillConfigSaved: "Skill configuration saved",
    noSkillConfig: "No skills linked to this tool yet.",
    linkedSkills: "Linked Skills",
    availableSkills: "Available Skills",
    searchLinkedSkills: "Search linked skills",
    searchAvailableSkills: "Search available skills",
    noAvailableSkills: "No skills available to add.",
    noLinkedSkillsMatched: "No linked skills match the search.",
    clickToEditPath: "Click to edit path",
    pathOptional: "Optional, leave empty if not configured",
    pathSavedThroughEdit: "Edit the tool to update paths",
    directory: "Directory",
    file: "File",
    marketplacePlaceholder: "Discover and install new skills from the community",
    settingsPlaceholder: "Settings can later host global preferences, scanning rules, and policies.",
    feedbackPlaceholder: "Feedback can later host issue submission and diagnostics reporting.",
    skillCreated: "Skill created",
    skillDeleted: "Skill deleted",
    skillSaved: "Skill saved",
    folderOpened: "Skills folder opened",
    marketplaceHint: "Browse and install community-shared skills",
    searchMarketplace: "Search marketplace...",
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

const createSkillTemplate = (name: string) => `# ${name}

## Goal

Describe the goal of this skill.

## Inputs

- input

## Steps

- Step 1
- Step 2

## Output

Describe the expected output.
`;

const isValidSkillName = (value: string) =>
  Boolean(value.trim()) && !/[\\/]/.test(value) && value !== "." && value !== "..";

export default function App() {
  const dispatch = useAppDispatch();
  const { activeView, config, error, lastSkillTest, loading, notice, saving, skills } =
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

  useEffect(() => {
    // #region debug-point C:active-view-changed
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "C", location: "App.tsx:246", msg: "[DEBUG] activeView changed", data: { activeView }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  }, [activeView]);

  const overview = useMemo(
    () => ({
      toolCount: config ? Object.keys(config.tools).length : 0,
      skillCount: skills.length,
      linkCount: config ? Object.values(config.links).reduce((sum, items) => sum + items.length, 0) : 0,
    }),
    [config, skills.length]
  );

  const handleCreateSkill = async (name: string) => {
    if (!config || !isValidSkillName(name)) {
      throw new Error("Invalid skill name");
    }
    const path = `${config.storage_path}/${name.trim()}`;
    try {
      await dispatch(
        createSkillEntry({
          path,
          content: createSkillTemplate(name.trim()),
          successMessage: labels.skillCreated,
        })
      ).unwrap();
    } catch (e) {
      console.error('Create skill failed:', e);
      throw e;
    }
  };

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
        <div className="fixed right-5 top-5 z-[70]">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
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
            dispatch(clearSkillTest());
          }}
        />

        <main className="flex-1 p-4 md:p-6">
          <header className="mb-6 rounded-3xl border border-gray-200/80 bg-white px-6 py-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              {/* Left Section: Title, Path, and Stats */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{labels.appTitle}</h1>
                  <p className="mt-1 text-[13px] text-gray-500">{config.storage_path}</p>
                </div>

                <div className="hidden h-8 w-px bg-gray-100 lg:block" />

                <div className="flex gap-2">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 px-4 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Tools</span>
                    <span className="text-base font-bold text-gray-900">{overview.toolCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 px-4 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Skills</span>
                    <span className="text-base font-bold text-gray-900">{overview.skillCount}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 px-4 py-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Links</span>
                    <span className="text-base font-bold text-gray-900">{overview.linkCount}</span>
                  </div>
                </div>
              </div>

              {/* Right Section: Controls */}
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
            </div>
          </header>

          <div>
            {activeView === "skills" && (
              <SkillsView
                labels={labels}
                storagePath={config.storage_path}
                skills={skills}
                saving={saving}
                onRefresh={() => void dispatch(loadWorkspace())}
                onOpenFolder={() => void dispatch(openSkillFolder(labels.folderOpened))}
                onCreateSkill={handleCreateSkill}
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
              />
            )}

            {activeView === "tools" && (
              <ToolsView
                labels={labels}
                config={config}
                skills={skills}
                saving={saving}
                lastSkillTest={lastSkillTest}
                onRefresh={() => void dispatch(loadWorkspace())}
                onPersistConfig={(nextConfig, successMessage) =>
                  void dispatch(persistWorkspaceConfig({ config: nextConfig, successMessage }))
                }
                onTestSkill={(toolId, skillName) =>
                  void dispatch(runToolSkillTest({ toolId, skillName }))
                }
              />
            )}

            {activeView === "marketplace" && (
              <MarketplaceView
                labels={labels}
                storagePath={config.storage_path}
                onRefresh={() => void dispatch(loadWorkspace())}
                onDownloadSuccess={() => {
                  void dispatch(loadWorkspace());
                }}
              />
            )}

            {activeView === "settings" && (
              <PlaceholderView
                title={labels.settings}
                description={labels.settingsPlaceholder}
              />
            )}

            {activeView === "feedback" && (
              <PlaceholderView
                title={labels.feedback}
                description={labels.feedbackPlaceholder}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
