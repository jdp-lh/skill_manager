import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Settings2, Trash2, Check, X } from "lucide-react";
import { AppConfig, SkillEntry, ToolConfig, ToolSkillSettings } from "../lib/api";
import { ToolFormModal, ToolFormValue } from "../components/ToolFormModal";
import { SkillConfigModal } from "../components/SkillConfigModal";
import { ToolIcon } from "../components/ToolIcon";

type ToolsViewProps = {
  labels: Record<string, string>;
  config: AppConfig;
  skills: SkillEntry[];
  saving: boolean;
  onRefresh: () => void | Promise<void>;
  onPersistConfig: (config: AppConfig, successMessage: string) => void;
};

const compareNames = (left: string, right: string) =>
  left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });

const buildToolEntries = (tools: AppConfig["tools"]) =>
  Object.entries(tools).sort((left, right) =>
    compareNames(left[1].name || left[0], right[1].name || right[0])
  );

const buildDefaultSkillsPath = (toolId: string) => `~/.${toolId}/skills`;

export function ToolsView({
  labels,
  config,
  skills,
  saving,
  onRefresh,
  onPersistConfig,
}: ToolsViewProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [toolModal, setToolModal] = useState<ToolFormValue | null>(null);
  const [skillConfigToolId, setSkillConfigToolId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ toolId: string; tool: ToolConfig } | null>(null);
  const [pathValues, setPathValues] = useState<Record<string, { target_dir: string }>>({});

  const toolEntries = useMemo(() => buildToolEntries(config.tools), [config.tools]);

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const [, tool] of toolEntries) {
      tool.tags.forEach((tag) => tags.add(tag));
    }
    return ["all", ...Array.from(tags).sort(compareNames)];
  }, [toolEntries]);

  const filteredTools = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return toolEntries.filter(([, tool]) => {
      const matchSearch =
        !normalizedSearch ||
        tool.name.toLowerCase().includes(normalizedSearch) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
      const matchTag = activeTag === "all" || tool.tags.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [activeTag, search, toolEntries]);

  const skillConfigTool = skillConfigToolId ? config.tools[skillConfigToolId] : null;

  const handleDeleteTool = (toolId: string) => {
    const nextTools = { ...config.tools };
    delete nextTools[toolId];

    const nextLinks = Object.fromEntries(
      Object.entries(config.links)
        .map(([skillName, toolIds]) => [skillName, toolIds.filter((id) => id !== toolId)])
        .filter(([, toolIds]) => toolIds.length > 0)
    );

    const nextSettings = { ...config.tool_skill_settings };
    delete nextSettings[toolId];

    onPersistConfig(
      {
        ...config,
        tools: nextTools,
        links: nextLinks,
        tool_skill_settings: nextSettings,
      },
      labels.toolDeleted
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    handleDeleteTool(deleteTarget.toolId);
    setDeleteTarget(null);
  };

  const handleToolSubmit = ({ id, tool }: ToolFormValue) => {
    const nextTools = { ...config.tools };
    if (toolModal && toolModal.id !== id) {
      delete nextTools[toolModal.id];
    }
    nextTools[id] = tool;

    const nextLinks = { ...config.links };
    const nextSettings = { ...config.tool_skill_settings };

    if (toolModal && toolModal.id !== id) {
      for (const skillName of Object.keys(nextLinks)) {
        nextLinks[skillName] = nextLinks[skillName].map((item) => (item === toolModal.id ? id : item));
      }
      if (nextSettings[toolModal.id]) {
        nextSettings[id] = nextSettings[toolModal.id];
        delete nextSettings[toolModal.id];
      }
    }

    onPersistConfig(
      {
        ...config,
        tools: nextTools,
        links: nextLinks,
        tool_skill_settings: nextSettings,
      },
      labels.toolSaved
    );
    setToolModal(null);
  };

  const handleToggleEnabled = (toolId: string, enabled: boolean) => {
    onPersistConfig(
      {
        ...config,
        tools: {
          ...config.tools,
          [toolId]: {
            ...config.tools[toolId],
            enabled,
          },
        },
      },
      labels.toolSaved
    );
  };

  const handlePathChange = (toolId: string, value: string) => {
    const normalizedValue = value.trim() || buildDefaultSkillsPath(toolId);
    onPersistConfig(
      {
        ...config,
        tools: {
          ...config.tools,
          [toolId]: {
            ...config.tools[toolId],
            target_dir: normalizedValue,
          },
        },
      },
      labels.toolSaved
    );
  };

  const handleSaveSkillConfig = (
    toolId: string,
    links: string[],
    settings: Record<string, ToolSkillSettings>
  ) => {
    const nextLinks = { ...config.links };
    const allSkillNames = new Set([
      ...Object.keys(nextLinks),
      ...links,
      ...Object.keys(config.tool_skill_settings[toolId] || {}),
    ]);

    for (const skillName of allSkillNames) {
      const toolIds = new Set(nextLinks[skillName] || []);
      if (links.includes(skillName)) {
        toolIds.add(toolId);
      } else {
        toolIds.delete(toolId);
      }

      if (toolIds.size === 0) {
        delete nextLinks[skillName];
      } else {
        nextLinks[skillName] = Array.from(toolIds).sort(compareNames);
      }
    }

    const nextSettings = {
      ...config.tool_skill_settings,
      [toolId]: settings,
    };

    if (Object.keys(settings).length === 0) {
      delete nextSettings[toolId];
    }

    onPersistConfig(
      {
        ...config,
        links: nextLinks,
        tool_skill_settings: nextSettings,
      },
      labels.skillConfigSaved
    );
    setSkillConfigToolId(null);
  };

  const role = new URLSearchParams(window.location.search).get("role") || "admin";
  const isViewer = role === "viewer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{labels.tools}</h1>
            <p className="mt-1 text-sm text-gray-500">{labels.toolsHint}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={async () => {
                setRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {labels.refresh}
            </button>
            <button
              onClick={() =>
                setToolModal({
                  id: "",
                  tool: {
                    name: "",
                    description: "",
                    icon: "Bot",
                    tags: [],
                    config_path: "",
                    target_dir: "",
                    enabled: true,
                  },
                })
              }
              disabled={isViewer}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {labels.addTool}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchTools}
              className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  activeTag === tag
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag === "all" ? labels.allTags : tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {filteredTools.map(([toolId, tool]) => (
          <article
            key={toolId}
            className="group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100/50 transition-colors group-hover:bg-blue-50/50">
                    <ToolIcon icon={tool.icon} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">{tool.name}</h2>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide ${tool.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {tool.enabled ? 'Enabled' : labels.disabled}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">ID: {toolId}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={tool.enabled}
                      onChange={(event) => handleToggleEnabled(toolId, event.target.checked)}
                      disabled={isViewer}
                    />
                    <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-500 peer-disabled:opacity-50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Description */}
              {tool.description && (
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                  {tool.description}
                </p>
              )}

              {/* Paths */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-gray-400">{labels.skillsPath}</span>
                  <input
                    type="text"
                    value={pathValues[toolId]?.target_dir ?? tool.target_dir}
                    onChange={(e) => setPathValues(prev => ({
                      ...prev,
                      [toolId]: {
                        target_dir: e.target.value
                      }
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const values = pathValues[toolId] || {};
                        handlePathChange(toolId, values.target_dir ?? tool.target_dir);
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[toolId];
                          return newValues;
                        });
                      } else if (e.key === 'Escape') {
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[toolId];
                          return newValues;
                        });
                      }
                    }}
                    placeholder={buildDefaultSkillsPath(toolId)}
                    className="h-9 flex-1 rounded-xl border border-gray-200 bg-white px-3 font-mono text-xs text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label={`${labels.skillsPath} for ${tool.name}`}
                  />
                </div>
                {pathValues[toolId]?.target_dir !== undefined && (
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => {
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[toolId];
                          return newValues;
                        });
                      }}
                      className="flex items-center justify-center h-7 w-7 rounded-xl border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const values = pathValues[toolId] || {};
                        if (values.target_dir !== undefined) {
                          handlePathChange(toolId, values.target_dir);
                        }
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[toolId];
                          return newValues;
                        });
                      }}
                      className="flex items-center justify-center h-7 w-7 rounded-xl bg-green-500 text-white transition hover:bg-green-600"
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                  <Settings2 className="h-3 w-3" />
                  {Object.keys(config.tool_skill_settings[toolId] || {}).length} Skills
                </span>
              </div>

              <div className="flex w-full items-center gap-2 mt-1 sm:mt-0 sm:w-auto sm:ml-auto">
                <button
                  onClick={() => setToolModal({ id: toolId, tool })}
                  disabled={isViewer}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                  aria-label={`${labels.edit} ${tool.name}`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {labels.editTool}
                </button>
                <button
                  onClick={() => setSkillConfigToolId(toolId)}
                  disabled={isViewer}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  <Settings2 className="h-3.5 w-3.5 opacity-80" />
                  {labels.configureSkill}
                </button>
                <button
                  onClick={() => setDeleteTarget({ toolId, tool })}
                  disabled={isViewer}
                  className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={`${labels.delete} ${tool.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
          {labels.noToolsFound}
        </div>
      )}

      {toolModal && (
        <ToolFormModal
          title={toolModal.id ? labels.editTool : labels.createTool}
          labels={labels}
          initialValue={toolModal}
          existingIds={Object.keys(config.tools)}
          onClose={() => setToolModal(null)}
          onSubmit={handleToolSubmit}
        />
      )}

      {skillConfigToolId && skillConfigTool && (
        <SkillConfigModal
          labels={labels}
          toolId={skillConfigToolId}
          tool={skillConfigTool}
          config={config}
          skills={skills}
          saving={saving}
          onClose={() => setSkillConfigToolId(null)}
          onSave={(links, settings) => handleSaveSkillConfig(skillConfigToolId, links, settings)}
        />
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="px-6 py-5">
              <h3 className="text-base font-semibold text-gray-900">{labels.delete}</h3>
              <p className="mt-2 text-sm text-gray-500">
                {labels.confirmDeleteTool.replace("{tool}", deleteTarget.tool.name)}
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-50 bg-gray-50/50 px-6 py-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                {labels.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                {labels.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
