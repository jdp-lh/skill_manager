import { useEffect, useMemo, useState } from "react";
import { AppConfig, SkillEntry, SkillTestResult, ToolConfig, ToolSkillSettings } from "../lib/api";
import { FileText, FolderOpen, Search, Trash2, X } from "lucide-react";

type SkillConfigModalProps = {
  labels: Record<string, string>;
  toolId: string;
  tool: ToolConfig;
  config: AppConfig;
  skills: SkillEntry[];
  saving: boolean;
  lastTest: SkillTestResult | null;
  onClose: () => void;
  onSave: (links: string[], settings: Record<string, ToolSkillSettings>) => void;
  onTest: (skillName: string) => void;
};

const parseParameters = (value: string) => {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).map(([key, entry]) => [key, String(entry)])
  );
};

export function SkillConfigModal({
  labels,
  toolId,
  tool,
  config,
  skills,
  saving,
  lastTest,
  onClose,
  onSave,
  onTest,
}: SkillConfigModalProps) {
  const associatedLinks = useMemo(
    () =>
      Object.entries(config.links)
        .filter(([, toolIds]) => toolIds.includes(toolId))
        .map(([skillName]) => skillName)
        .sort((left, right) =>
          left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
        ),
    [config.links, toolId]
  );

  const [selectedSkill, setSelectedSkill] = useState("");
  const [links, setLinks] = useState<string[]>(associatedLinks);
  const [settings, setSettings] = useState<Record<string, ToolSkillSettings>>(
    config.tool_skill_settings[toolId] || {}
  );
  const [parameterDrafts, setParameterDrafts] = useState<Record<string, string>>({});
  const [linkedSearch, setLinkedSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLinks(associatedLinks);
    setSettings(config.tool_skill_settings[toolId] || {});
    setParameterDrafts(
      Object.fromEntries(
        Object.entries(config.tool_skill_settings[toolId] || {}).map(([skillName, value]) => [
          skillName,
          JSON.stringify(value.parameters || {}, null, 2),
        ])
      )
    );
  }, [associatedLinks, config.tool_skill_settings, toolId]);

  const availableSkills = useMemo(
    () =>
      skills
        .filter((skill) => !links.includes(skill.name))
        .filter((skill) =>
          skill.name.toLowerCase().includes(availableSearch.trim().toLowerCase())
        ),
    [availableSearch, links, skills]
  );

  const linkedSkillEntries = useMemo(
    () =>
      links
        .map((skillName) => skills.find((skill) => skill.name === skillName))
        .filter((skill): skill is SkillEntry => Boolean(skill))
        .filter((skill) => skill.name.toLowerCase().includes(linkedSearch.trim().toLowerCase())),
    [linkedSearch, links, skills]
  );

  const handleAddSkill = () => {
    if (!selectedSkill) {
      return;
    }

    setLinks((current) =>
      [...current, selectedSkill].sort((left, right) =>
        left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
      )
    );
    setSettings((current) => ({
      ...current,
      [selectedSkill]: current[selectedSkill] || {
        enabled: true,
        priority: 0,
        parameters: {},
      },
    }));
    setParameterDrafts((current) => ({
      ...current,
      [selectedSkill]: current[selectedSkill] || "{}",
    }));
    setSelectedSkill("");
    setAvailableSearch("");
  };

  const updateSetting = (
    skillName: string,
    key: keyof ToolSkillSettings,
    value: ToolSkillSettings[keyof ToolSkillSettings]
  ) => {
    setSettings((current) => ({
      ...current,
      [skillName]: {
        enabled: current[skillName]?.enabled ?? true,
        priority: current[skillName]?.priority ?? 0,
        parameters: current[skillName]?.parameters ?? {},
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    try {
      for (const skillName of links) {
        parseParameters(parameterDrafts[skillName] || "{}");
      }
      onSave(
        links,
        Object.fromEntries(
          links.map((skillName) => [
            skillName,
            {
              ...(settings[skillName] || {
                enabled: true,
                priority: 0,
                parameters: {},
              }),
              parameters: parseParameters(parameterDrafts[skillName] || "{}"),
            },
          ])
        )
      );
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : String(currentError));
    }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {labels.skillConfigTitle.replace("{tool}", tool.name)}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{tool.description || labels.skillConfigHint}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1.8fr]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{labels.availableSkills}</h4>
                <p className="mt-1 text-xs text-gray-500">{labels.skillConfigHint}</p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                {availableSkills.length}
              </span>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={availableSearch}
                onChange={(event) => setAvailableSearch(event.target.value)}
                placeholder={labels.searchAvailableSkills}
                className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSkill}
              onChange={(event) => setSelectedSkill(event.target.value)}
              aria-label={labels.selectSkill}
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{labels.selectSkill}</option>
              {availableSkills.map((skill) => (
                <option key={skill.path} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddSkill}
              disabled={!selectedSkill}
              className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {labels.addSkill}
            </button>
            {availableSkills.length === 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white px-3 py-4 text-center text-sm text-gray-500">
                {labels.noAvailableSkills}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{labels.linkedSkills}</h4>
                <p className="mt-1 text-xs text-gray-500">{labels.priorityHint}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {links.length}
              </span>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={linkedSearch}
                onChange={(event) => setLinkedSearch(event.target.value)}
                placeholder={labels.searchLinkedSkills}
                className="w-full rounded-xl border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2">
          {linkedSkillEntries.map((skill) => {
            const skillName = skill.name;
            const currentSetting = settings[skillName] || {
              enabled: true,
              priority: 0,
              parameters: {},
            };
            return (
              <div
                key={skillName}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{skillName}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {skill.is_dir ? (
                          <FolderOpen className="h-3.5 w-3.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {skill.is_dir ? labels.directory : labels.file}
                      </span>
                      <span className="truncate font-mono text-[11px] text-gray-400">{skill.path}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setLinks((current) => current.filter((item) => item !== skillName));
                      setSettings((current) => {
                        const next = { ...current };
                        delete next[skillName];
                        return next;
                      });
                      setParameterDrafts((current) => {
                        const next = { ...current };
                        delete next[skillName];
                        return next;
                      });
                    }}
                    className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_140px_1fr]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{labels.enabled}</span>
                    <div className="flex h-[42px] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3">
                      <input
                        type="checkbox"
                        checked={currentSetting.enabled}
                        onChange={(event) =>
                          updateSetting(skillName, "enabled", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {currentSetting.enabled ? labels.enabled : labels.disabled}
                      </span>
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{labels.priority}</span>
                    <input
                      type="number"
                      value={currentSetting.priority}
                      onChange={(event) =>
                        updateSetting(skillName, "priority", Number(event.target.value))
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">{labels.parameters}</span>
                    <textarea
                      value={parameterDrafts[skillName] ?? JSON.stringify(currentSetting.parameters || {}, null, 2)}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setParameterDrafts((current) => ({
                          ...current,
                          [skillName]: nextValue,
                        }));
                        try {
                          updateSetting(skillName, "parameters", parseParameters(nextValue));
                          setError("");
                        } catch {
                          setError(labels.parameterFormatError);
                        }
                      }}
                      rows={5}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {lastTest?.tool_id === toolId && lastTest.skill_name === skillName
                      ? lastTest.message
                      : labels.testHint}
                  </div>
                  <button
                    onClick={() => onTest(skillName)}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    {labels.testSkill}
                  </button>
                </div>
              </div>
            );
          })}

          {links.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-sm text-gray-500">
              {labels.noSkillConfig}
            </div>
          )}

          {links.length > 0 && linkedSkillEntries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-sm text-gray-500">
              {labels.noLinkedSkillsMatched}
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            {labels.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? labels.saving : labels.saveSkillConfig}
          </button>
        </div>
      </div>
    </div>
  );
}
