import { useMemo, useState } from "react";
import { FolderOpen, RefreshCw, Save, Search, Trash2, X, Settings2, Plus } from "lucide-react";
import { SkillEntry } from "../lib/api";

type SkillsViewProps = {
  labels: Record<string, string>;
  storagePath: string;
  skills: SkillEntry[];
  saving: boolean;
  onRefresh: () => void | Promise<void>;
  onDeleteSkill: (skill: SkillEntry) => Promise<void>;
  onReadSkill: (path: string) => Promise<string>;
  onSaveSkill: (skill: SkillEntry, content: string) => Promise<void>;
  onNavigateToMarketplace?: () => void;
};

export function SkillsView({
  labels,
  storagePath,
  skills,
  onRefresh,
  onDeleteSkill,
  onReadSkill,
  onSaveSkill,
  onNavigateToMarketplace,
}: SkillsViewProps) {
  const [search, setSearch] = useState("");
  const [editingSkill, setEditingSkill] = useState<SkillEntry | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SkillEntry | null>(null);

  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) =>
        skill.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search, skills]
  );

  const openEditor = async (skill: SkillEntry) => {
    setLoading(true);
    try {
      const fileContent = await onReadSkill(skill.path);
      setContent(fileContent);
      setEditingSkill(skill);
    } catch (error) {
      console.error("Failed to read skill:", error);
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDeleteSkill(deleteTarget);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

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
          {onNavigateToMarketplace && (
            <button
              onClick={onNavigateToMarketplace}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              {labels.newSkill}
            </button>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchSkills}
              className="w-full rounded-xl border border-gray-300 py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filteredSkills.map((skill) => (
          <article
            key={skill.path}
            className="group flex flex-col justify-between rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              void openEditor(skill);
            }}
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100/50 transition-colors group-hover:bg-emerald-100/50">
                    <span className="text-xl font-bold text-emerald-600">
                      {(skill.name.endsWith('.md') ? skill.name.slice(0, 1) : skill.name.slice(0, 1)).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 
                      className="truncate text-base font-semibold text-gray-900"
                      title={skill.name.endsWith('.md') ? skill.name.slice(0, -3) : skill.name}
                    >
                      {skill.name.endsWith('.md') ? skill.name.slice(0, -3) : skill.name}
                    </h2>
                    <p 
                      className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600"
                      title={skill.description || labels.skillDescriptionFallback || "暂无描述"}
                    >
                      {skill.description || labels.skillDescriptionFallback || "暂无描述"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-gray-100 pt-4 gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void openEditor(skill);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                aria-label={`${labels.edit} ${skill.name}`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                {labels.edit}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteTarget(skill);
                }}
                className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label={`${labels.delete} ${skill.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-500">
          {labels.noSkillsFound}
        </div>
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
                {labels.confirmDeleteAgent
                  ? labels.confirmDeleteAgent.replace("{agent}", deleteTarget.name)
                  : `${labels.delete} ${deleteTarget.name}?`}
              </p>
            </div>
            <div className="border-t border-gray-50 bg-gray-50/50 px-6 py-4 flex justify-end gap-3">
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
