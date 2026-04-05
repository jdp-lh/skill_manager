import { FormEvent, useEffect, useMemo, useState } from "react";
import { ToolConfig } from "../lib/api";
import { X } from "lucide-react";

export type ToolFormValue = {
  id: string;
  tool: ToolConfig;
};

type ToolFormModalProps = {
  title: string;
  labels: Record<string, string>;
  initialValue: ToolFormValue;
  existingIds: string[];
  onClose: () => void;
  onSubmit: (value: ToolFormValue) => void;
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export function ToolFormModal({
  title,
  labels,
  initialValue,
  existingIds,
  onClose,
  onSubmit,
}: ToolFormModalProps) {
  const [id, setId] = useState(initialValue.id);
  const [name, setName] = useState(initialValue.tool.name);
  const [description, setDescription] = useState(initialValue.tool.description);
  const [icon, setIcon] = useState(initialValue.tool.icon);
  const [configPath, setConfigPath] = useState(initialValue.tool.config_path);
  const [skillsPath, setSkillsPath] = useState(initialValue.tool.target_dir);
  const [tagsText, setTagsText] = useState(initialValue.tool.tags.join(", "));
  const [enabled, setEnabled] = useState(initialValue.tool.enabled);
  const [error, setError] = useState("");

  const duplicated = useMemo(
    () => id.trim() !== initialValue.id && existingIds.includes(id.trim()),
    [existingIds, id, initialValue.id]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedId = id.trim();
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      setError(labels.invalidToolId);
      return;
    }
    if (duplicated) {
      setError(labels.duplicateToolId);
      return;
    }
    if (!name.trim()) {
      setError(labels.toolNameRequired);
      return;
    }

    onSubmit({
      id: trimmedId,
      tool: {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || "Bot",
        config_path: configPath.trim(),
        target_dir: skillsPath.trim(),
        tags: parseTags(tagsText),
        enabled,
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
              <span className="text-sm font-medium text-gray-700">{labels.toolId}</span>
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
              <span className="text-sm font-medium text-gray-700">{labels.toolName}</span>
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

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">{labels.description}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.icon}</span>
              <input
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.tags}</span>
              <input
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder={labels.tagsPlaceholder}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.configPath}</span>
              <span className="block text-xs text-gray-400">{labels.pathOptional}</span>
              <input
                value={configPath}
                onChange={(event) => setConfigPath(event.target.value)}
                placeholder="~/.tool/config"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">{labels.skillsPath}</span>
              <span className="block text-xs text-gray-400">{labels.pathOptional}</span>
              <input
                value={skillsPath}
                onChange={(event) => setSkillsPath(event.target.value)}
                placeholder="~/.tool/skills"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{labels.enabled}</span>
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
