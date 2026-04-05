import { useEffect, useMemo, useState } from "react";
import {
  AppConfig,
  SkillEntry,
  AgentConfig,
  AgentSkillSettings,
} from "../lib/api";
import {
  Search,
  X,
  Plus,
} from "lucide-react";

type SkillConfigModalProps = {
  labels: Record<string, string>;
  agentId: string;
  agent: AgentConfig;
  config: AppConfig;
  skills: SkillEntry[];
  saving: boolean;
  onClose: () => void;
  onSave: (
    links: string[],
    settings: Record<string, AgentSkillSettings>,
  ) => void;
};

export function SkillConfigModal({
  labels,
  agentId,
  agent,
  config,
  skills,
  saving,
  onClose,
  onSave,
}: SkillConfigModalProps) {
  const associatedLinks = useMemo(
    () =>
      Object.entries(config.links)
        .filter(([, agentIds]) => agentIds.includes(agentId))
        .map(([skillName]) => skillName)
        .sort((left, right) =>
          left.localeCompare(right, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        ),
    [config.links, agentId],
  );

  const [links, setLinks] = useState<string[]>(associatedLinks);
  const [linkedSearch, setLinkedSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");

  useEffect(() => {
    setLinks(associatedLinks);
  }, [associatedLinks]);

  const availableSkills = useMemo(
    () =>
      skills
        .filter((skill) => !links.includes(skill.name))
        .filter((skill) =>
          skill.name
            .toLowerCase()
            .includes(availableSearch.trim().toLowerCase()),
        ),
    [availableSearch, links, skills],
  );

  const linkedSkillEntries = useMemo(
    () =>
      links
        .map((skillName) => skills.find((skill) => skill.name === skillName))
        .filter((skill): skill is SkillEntry => Boolean(skill))
        .filter((skill) =>
          skill.name.toLowerCase().includes(linkedSearch.trim().toLowerCase()),
        ),
    [linkedSearch, links, skills],
  );



  const handleAddSkill = (skillName: string) => {
    setLinks((current) =>
      [...current, skillName].sort((left, right) =>
        left.localeCompare(right, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    );
  };

  const handleAddAll = () => {
    setLinks((current) =>
      [...current, ...availableSkills.map((s) => s.name)].sort((left, right) =>
        left.localeCompare(right, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    );
  };

  const handleSave = () => {
    onSave(
      links,
      Object.fromEntries(
        links.map((skillName) => [
          skillName,
          config.agent_skill_settings[agentId]?.[skillName] || {
            enabled: true,
            priority: 0,
            parameters: {},
          },
        ]),
      ),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleRemoveAll = () => {
    setLinks([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#fcfcfd] shadow-2xl shadow-black/5"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-950">
              {labels.skillConfigTitle.replace("{agent}", agent.name)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#fcfcfd] p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {labels.availableSkills}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    从本地 skill 列表中选择并关联到当前 Agent。
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                  {availableSkills.length}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={handleAddAll}
                  disabled={availableSkills.length === 0}
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-50"
                >
                  全部添加 ({availableSkills.length})
                </button>
              </div>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={availableSearch}
                  onChange={(event) => setAvailableSearch(event.target.value)}
                  placeholder={labels.searchAvailableSkills}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {availableSkills.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                  {labels.noAvailableSkills}
                </div>
              ) : (
                <div className="mt-3 space-y-2 overflow-y-auto max-h-[400px] pr-1 pb-4">
                  {availableSkills.map((skill) => (
                    <button
                      key={skill.path}
                      onClick={() => handleAddSkill(skill.name)}
                      className="group flex w-full flex-col gap-1.5 items-start justify-between rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="truncate font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">
                          {skill.name.endsWith('.md') ? skill.name.slice(0, -3) : skill.name}
                        </span>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 opacity-0 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:opacity-100 ml-2">
                          <Plus className="h-3 w-3" />
                        </div>
                      </div>
                      
                      {skill.description && (
                        <p className="line-clamp-2 text-xs text-gray-500 w-full" title={skill.description}>
                          {skill.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {labels.linkedSkills}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      当前 Agent 已关联的 skills，支持快速移除。
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                    {links.length}
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <input
                      value={linkedSearch}
                      onChange={(event) => setLinkedSearch(event.target.value)}
                      placeholder={labels.searchLinkedSkills}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  {links.length > 0 && (
                    <button
                      onClick={handleRemoveAll}
                      className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700"
                    >
                      全部移除
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {linkedSkillEntries.map((skill) => {
              const skillName = skill.name;
              return (
                <div
                    key={skillName}
                    className="group relative flex min-h-[70px] flex-col rounded-xl border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm"
                  >
                  <button
                    onClick={() => {
                      setLinks((current) =>
                        current.filter((item) => item !== skillName),
                      );
                    }}
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-500 opacity-0 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    title={labels.delete}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  <div className="flex w-full items-center justify-between pr-6">
                    <span className="truncate font-semibold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">
                      {skillName.endsWith('.md') ? skillName.slice(0, -3) : skillName}
                    </span>
                  </div>

                  {skill.description && (
                    <p className="line-clamp-2 mt-1.5 text-xs text-gray-500 w-full" title={skill.description}>
                      {skill.description}
                    </p>
                  )}
                </div>
              );
            })}

            {links.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 shadow-sm lg:col-span-2 2xl:col-span-3">
                {labels.noSkillConfig}
              </div>
            )}

            {links.length > 0 && linkedSkillEntries.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center text-sm text-gray-500 shadow-sm lg:col-span-2 2xl:col-span-3">
                {labels.noLinkedSkillsMatched}
              </div>
            )}
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            {labels.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? labels.saving : labels.saveSkillConfig}
          </button>
        </div>
      </div>
    </div>
  );
}
