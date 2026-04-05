import { FormEvent, useEffect, useMemo, useState } from "react";
import { AgentConfig } from "../lib/api";
import { ChevronDown, X } from "lucide-react";
import { AgentIcon, AVAILABLE_ICONS } from "./AgentIcon";

export type AgentFormValue = {
  id: string;
  agent: AgentConfig;
};

type AgentFormModalProps = {
  title: string;
  labels: Record<string, string>;
  initialValue: AgentFormValue;
  existingIds: string[];
  onClose: () => void;
  onSubmit: (value: AgentFormValue) => void;
};

const buildDefaultSkillsPath = (agentId: string) => {
  const trimmedAgentId = agentId.trim();
  return trimmedAgentId ? `~/.${trimmedAgentId}/skills` : "";
};

export function AgentFormModal({
  title,
  labels,
  initialValue,
  existingIds,
  onClose,
  onSubmit,
}: AgentFormModalProps) {
  const [id, setId] = useState(initialValue.id);
  const [name, setName] = useState(initialValue.agent.name);
  const [description, setDescription] = useState(initialValue.agent.description);
  const [icon, setIcon] = useState(initialValue.agent.icon || "Bot");
  const [skillsPath, setSkillsPath] = useState(
    initialValue.agent.target_dir || buildDefaultSkillsPath(initialValue.id)
  );
  const [error, setError] = useState("");
  const [autoSkillsPath, setAutoSkillsPath] = useState(
    !initialValue.agent.target_dir ||
      initialValue.agent.target_dir === buildDefaultSkillsPath(initialValue.id)
  );

  const duplicated = useMemo(
    () => id.trim() !== initialValue.id && existingIds.includes(id.trim()),
    [existingIds, id, initialValue.id]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedId = id.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      setError(labels.invalidAgentId);
      return;
    }
    if (duplicated) {
      setError(labels.duplicateAgentId);
      return;
    }
    if (!name.trim()) {
      setError(labels.agentNameRequired);
      return;
    }
    if (!skillsPath.trim()) {
      setError(labels.skillsPathRequired);
      return;
    }

    onSubmit({
      id: trimmedId,
      agent: {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || "Bot",
        config_path: "",
        target_dir: skillsPath.trim(),
        tags: initialValue.agent.tags || [],
        enabled: true,
      },
    });
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

  useEffect(() => {
    if (autoSkillsPath) {
      setSkillsPath(buildDefaultSkillsPath(id));
    }
  }, [autoSkillsPath, id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.agentId}</span>
              <input
                value={id}
                onChange={(event) => {
                  setId(event.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.agentName}</span>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 relative">
              <span className="text-sm font-medium text-gray-700">{labels.icon}</span>
              <div className="relative">
                <button
                  type="button"
                  className="w-full flex items-center justify-between rounded-xl border border-gray-300 bg-white py-2 pl-3 pr-4 transition-colors hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    const dropdown = document.getElementById("icon-dropdown");
                    if (dropdown) {
                      dropdown.classList.toggle("hidden");
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AgentIcon icon={icon} className="h-5 w-5 text-gray-700" />
                    <span className="text-sm text-gray-700">{icon}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                <div
                  id="icon-dropdown"
                  className="absolute z-10 mt-1 hidden w-full rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                >
                  <div className="grid grid-cols-5 gap-1">
                    {AVAILABLE_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIcon(iconName);
                          document.getElementById("icon-dropdown")?.classList.add("hidden");
                        }}
                        className={`flex aspect-square items-center justify-center rounded-lg transition-all ${
                          icon === iconName
                            ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        title={iconName}
                      >
                        <AgentIcon icon={iconName} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.skillsPath}</span>
              <span className="ml-2 text-xs text-gray-400">{labels.skillsPathHint}</span>
              <input
                value={skillsPath}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSkillsPath(nextValue);
                  setAutoSkillsPath(nextValue.trim() === buildDefaultSkillsPath(id));
                  setError("");
                }}
                placeholder={buildDefaultSkillsPath(id) || "~/.agent-id/skills"}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">{labels.description}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {labels.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
