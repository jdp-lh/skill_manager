import { useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Settings2, Trash2, Check, X, Puzzle } from "lucide-react";
import { AppConfig, SkillEntry, AgentConfig, AgentSkillSettings } from "../lib/api";
import { AgentFormModal, AgentFormValue } from "../components/AgentFormModal";
import { SkillConfigModal } from "../components/SkillConfigModal";
import { AgentIcon } from "../components/AgentIcon";

type AgentsViewProps = {
  labels: Record<string, string>;
  config: AppConfig;
  skills: SkillEntry[];
  saving: boolean;
  onRefresh: () => void | Promise<void>;
  onPersistConfig: (config: AppConfig, successMessage: string) => void;
};

const compareNames = (left: string, right: string) =>
  left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });

const buildAgentEntries = (agents: AppConfig["agents"]) =>
  Object.entries(agents).sort((left, right) =>
    compareNames(left[1].name || left[0], right[1].name || right[0])
  );

const buildDefaultSkillsPath = (agentId: string) => `~/.${agentId}/skills`;

export function AgentsView({
  labels,
  config,
  skills,
  saving,
  onRefresh,
  onPersistConfig,
}: AgentsViewProps) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [agentModal, setAgentModal] = useState<AgentFormValue | null>(null);
  const [skillConfigAgentId, setSkillConfigAgentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ agentId: string; agent: AgentConfig } | null>(null);
  const [pathValues, setPathValues] = useState<Record<string, { target_dir: string }>>({});

  const agentEntries = useMemo(() => buildAgentEntries(config.agents), [config.agents]);

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return agentEntries.filter(([, agent]) => {
      const matchSearch =
        !normalizedSearch ||
        agent.name.toLowerCase().includes(normalizedSearch) ||
        agent.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch));
      return matchSearch;
    });
  }, [search, agentEntries]);

  const skillConfigAgent = skillConfigAgentId ? config.agents[skillConfigAgentId] : null;

  const handleDeleteAgent = (agentId: string) => {
    const nextAgents = { ...config.agents };
    delete nextAgents[agentId];

    const nextLinks = Object.fromEntries(
      Object.entries(config.links)
        .map(([skillName, agentIds]) => [skillName, agentIds.filter((id) => id !== agentId)])
        .filter(([, agentIds]) => agentIds.length > 0)
    );

    const nextSettings = { ...config.agent_skill_settings };
    delete nextSettings[agentId];

    onPersistConfig(
      {
        ...config,
        agents: nextAgents,
        links: nextLinks,
        agent_skill_settings: nextSettings,
      },
      labels.agentDeleted
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    handleDeleteAgent(deleteTarget.agentId);
    setDeleteTarget(null);
  };

  const handleAgentSubmit = ({ id, agent }: AgentFormValue) => {
    const nextAgents = { ...config.agents };
    if (agentModal && agentModal.id !== id) {
      delete nextAgents[agentModal.id];
    }
    nextAgents[id] = agent;

    const nextLinks = { ...config.links };
    const nextSettings = { ...config.agent_skill_settings };

    if (agentModal && agentModal.id !== id) {
      for (const skillName of Object.keys(nextLinks)) {
        nextLinks[skillName] = nextLinks[skillName].map((item) => (item === agentModal.id ? id : item));
      }
      if (nextSettings[agentModal.id]) {
        nextSettings[id] = nextSettings[agentModal.id];
        delete nextSettings[agentModal.id];
      }
    }

    onPersistConfig(
      {
        ...config,
        agents: nextAgents,
        links: nextLinks,
        agent_skill_settings: nextSettings,
      },
      labels.agentSaved
    );
    setAgentModal(null);
  };

  const handleToggleEnabled = (agentId: string, enabled: boolean) => {
    onPersistConfig(
      {
        ...config,
        agents: {
          ...config.agents,
          [agentId]: {
            ...config.agents[agentId],
            enabled,
          },
        },
      },
      labels.agentSaved
    );
  };

  const handlePathChange = (agentId: string, value: string) => {
    const normalizedValue = value.trim() || buildDefaultSkillsPath(agentId);
    onPersistConfig(
      {
        ...config,
        agents: {
          ...config.agents,
          [agentId]: {
            ...config.agents[agentId],
            target_dir: normalizedValue,
          },
        },
      },
      labels.agentSaved
    );
  };

  const handleSaveSkillConfig = (
    agentId: string,
    links: string[],
    settings: Record<string, AgentSkillSettings>
  ) => {
    const nextLinks = { ...config.links };
    const allSkillNames = new Set([
      ...Object.keys(nextLinks),
      ...links,
      ...Object.keys(config.agent_skill_settings[agentId] || {}),
    ]);

    for (const skillName of allSkillNames) {
      const agentIds = new Set(nextLinks[skillName] || []);
      if (links.includes(skillName)) {
        agentIds.add(agentId);
      } else {
        agentIds.delete(agentId);
      }

      if (agentIds.size === 0) {
        delete nextLinks[skillName];
      } else {
        nextLinks[skillName] = Array.from(agentIds).sort(compareNames);
      }
    }

    const nextSettings = {
      ...config.agent_skill_settings,
      [agentId]: settings,
    };

    if (Object.keys(settings).length === 0) {
      delete nextSettings[agentId];
    }

    onPersistConfig(
      {
        ...config,
        links: nextLinks,
        agent_skill_settings: nextSettings,
      },
      labels.skillConfigSaved
    );
    setSkillConfigAgentId(null);
  };

  const role = new URLSearchParams(window.location.search).get("role") || "admin";
  const isViewer = role === "viewer";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{labels.agents}</h1>
          <p className="mt-1 text-[13px] text-gray-500">{labels.agentsHint}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''} ${!refreshing ? 'transition-transform active:-rotate-180' : ''}`} />
            {labels.refresh}
          </button>
          <button
            onClick={() =>
              setAgentModal({
                id: "",
                agent: {
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
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {labels.addAgent}
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchAgents}
              className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {filteredAgents.map(([agentId, agent]) => (
          <article
            key={agentId}
            className="group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100/50 transition-colors group-hover:bg-blue-50/50">
                    <AgentIcon icon={agent.icon} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">{agent.name}</h2>
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide ${agent.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {agent.enabled ? 'Enabled' : labels.disabled}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">ID: {agentId}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={agent.enabled}
                      onChange={(event) => handleToggleEnabled(agentId, event.target.checked)}
                      disabled={isViewer}
                    />
                    <div className="relative h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-500 peer-disabled:opacity-50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Description */}
              {agent.description && (
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                  {agent.description}
                </p>
              )}

              {/* Paths */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-medium text-gray-400">{labels.skillsPath}</span>
                  <input
                    type="text"
                    value={pathValues[agentId]?.target_dir ?? agent.target_dir}
                    onChange={(e) => setPathValues(prev => ({
                      ...prev,
                      [agentId]: {
                        target_dir: e.target.value
                      }
                    }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const values = pathValues[agentId] || {};
                        handlePathChange(agentId, values.target_dir ?? agent.target_dir);
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[agentId];
                          return newValues;
                        });
                      } else if (e.key === 'Escape') {
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[agentId];
                          return newValues;
                        });
                      }
                    }}
                    placeholder={buildDefaultSkillsPath(agentId)}
                    className="h-9 flex-1 rounded-xl border border-gray-200 bg-white px-3 font-mono text-xs text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label={`${labels.skillsPath} for ${agent.name}`}
                  />
                </div>
                {pathValues[agentId]?.target_dir !== undefined && (
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => {
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[agentId];
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
                        const values = pathValues[agentId] || {};
                        if (values.target_dir !== undefined) {
                          handlePathChange(agentId, values.target_dir);
                        }
                        setPathValues(prev => {
                          const newValues = { ...prev };
                          delete newValues[agentId];
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
                <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                  <Puzzle className="h-3 w-3" />
                  {Object.keys(config.agent_skill_settings[agentId] || {}).length} Skills
                </span>
              </div>

              <div className="flex w-full items-center gap-2 mt-1 sm:mt-0 sm:w-auto sm:ml-auto">
                <button
                  onClick={() => setAgentModal({ id: agentId, agent })}
                  disabled={isViewer}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                  aria-label={`${labels.edit} ${agent.name}`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {labels.editAgent}
                </button>
                <button
                  onClick={() => setSkillConfigAgentId(agentId)}
                  disabled={isViewer}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                >
                  <Settings2 className="h-3.5 w-3.5 opacity-80" />
                  {labels.configureSkill}
                </button>
                <button
                  onClick={() => setDeleteTarget({ agentId, agent })}
                  disabled={isViewer}
                  className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  aria-label={`${labels.delete} ${agent.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
          {labels.noAgentsFound}
        </div>
      )}

      {agentModal && (
        <AgentFormModal
          title={agentModal.id ? labels.editAgent : labels.createAgent}
          labels={labels}
          initialValue={agentModal}
          existingIds={Object.keys(config.agents)}
          onClose={() => setAgentModal(null)}
          onSubmit={handleAgentSubmit}
        />
      )}

      {skillConfigAgentId && skillConfigAgent && (
        <SkillConfigModal
          labels={labels}
          agentId={skillConfigAgentId}
          agent={skillConfigAgent}
          config={config}
          skills={skills}
          saving={saving}
          onClose={() => setSkillConfigAgentId(null)}
          onSave={(links, settings) => handleSaveSkillConfig(skillConfigAgentId, links, settings)}
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
                {labels.confirmDeleteAgent.replace("{agent}", deleteTarget.agent.name)}
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
