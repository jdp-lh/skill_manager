import { useEffect, useMemo, useState } from "react";
import { FileText, FolderOpen, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { SkillEntry } from "../lib/api";

type SkillsViewProps = {
  labels: Record<string, string>;
  storagePath: string;
  skills: SkillEntry[];
  saving: boolean;
  onRefresh: () => void;
  onOpenFolder: () => void;
  onCreateSkill: (name: string) => Promise<void>;
  onDeleteSkill: (skill: SkillEntry) => Promise<void>;
  onReadSkill: (path: string) => Promise<string>;
  onSaveSkill: (skill: SkillEntry, content: string) => Promise<void>;
};

export function SkillsView({
  labels,
  storagePath,
  skills,
  saving,
  onRefresh,
  onOpenFolder,
  onCreateSkill,
  onDeleteSkill,
  onReadSkill,
  onSaveSkill,
}: SkillsViewProps) {
  const [search, setSearch] = useState("");
  const [editingSkill, setEditingSkill] = useState<SkillEntry | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");

  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) =>
        skill.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search, skills]
  );

  useEffect(() => {
    if (!editingSkill) {
      return;
    }
    // #region debug-point C:skills-editor-opened
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "C", location: "SkillsView.tsx:46", msg: "[DEBUG] editingSkill state updated", data: { skillName: editingSkill.name, isDir: editingSkill.is_dir }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  }, [editingSkill]);

  const openEditor = async (skill: SkillEntry) => {
    // #region debug-point B:skills-open-editor-click
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "B", location: "SkillsView.tsx:51", msg: "[DEBUG] openEditor invoked", data: { skillName: skill.name, path: skill.path, isDir: skill.is_dir }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    setLoading(true);
    try {
      const fileContent = await onReadSkill(skill.path);
      // #region debug-point B:skills-read-success
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "B", location: "SkillsView.tsx:56", msg: "[DEBUG] skill content loaded", data: { skillName: skill.name, length: fileContent.length }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      setContent(fileContent);
      setEditingSkill(skill);
    } catch (error) {
      // #region debug-point B:skills-read-failed
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "B", location: "SkillsView.tsx:62", msg: "[DEBUG] skill content load failed", data: { skillName: skill.name, message: error instanceof Error ? error.message : String(error) }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      alert(`Failed to read skill: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingSkill) return;
    setLoading(true);
    try {
      await onSaveSkill(editingSkill, content);
      setEditingSkill(null);
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingSkill(null);
    setContent("");
  };
  useEffect(() => {
    if (showCreate) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setShowCreate(false);
          setNewSkillName("");
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showCreate]);


  if (editingSkill) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900">{editingSkill.name}</h2>
            <p className="mt-0.5 truncate font-mono text-[11px] text-gray-500">{editingSkill.path}</p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
              {labels.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {labels.save}
            </button>
          </div>
        </div>
        <div className="flex-1 p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none border-0 bg-white p-6 font-mono text-[13px] leading-relaxed text-gray-800 outline-none focus:ring-0"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{labels.skills}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="font-mono text-xs">{storagePath}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
            {labels.refresh}
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchSkills}
              className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onOpenFolder}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <FolderOpen className="h-4 w-4" />
            {labels.openFolder}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {labels.newSkill}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredSkills.map((skill) => (
          <article
            key={skill.path}
            className="group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100/50 bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100/50">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-gray-900">{skill.name}</h2>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-gray-400">{skill.path}</p>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteSkill(skill)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label={`${labels.delete} ${skill.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // #region debug-point A:skills-edit-button-click
                fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "click-no-response", runId: "pre-fix", hypothesisId: "A", location: "SkillsView.tsx:205", msg: "[DEBUG] skills edit button clicked", data: { skillName: skill.name, disabled: saving }, ts: Date.now() }) }).catch(() => {});
                // #endregion
                void openEditor(skill);
              }}
              disabled={saving}
              className="mt-6 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            >
              {labels.editSkill}
            </button>
          </article>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
          {labels.noSkillsFound}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreate(false);
              setNewSkillName("");
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">{labels.createSkill}</h3>
            </div>
            <div className="px-6 py-5">
              <label htmlFor="skill-name" className="mb-1.5 block text-sm font-medium text-gray-700">
                Skill Name
              </label>
              <input
                id="skill-name"
                autoFocus
                value={newSkillName}
                onChange={(event) => setNewSkillName(event.target.value)}
                placeholder={labels.skillNamePlaceholder}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewSkillName("");
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                {labels.cancel}
              </button>
              <button
                onClick={async () => {
                  if (!newSkillName.trim()) return;
                  await onCreateSkill(newSkillName);
                  setShowCreate(false);
                  setNewSkillName("");
                }}
                disabled={!newSkillName.trim()}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {labels.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
