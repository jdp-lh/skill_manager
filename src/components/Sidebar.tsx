import { Boxes, FileText, Store } from "lucide-react";
import { AppView } from "../store/workspaceSlice";

type SidebarProps = {
  activeView: AppView;
  labels: Record<string, string>;
  onSelect: (view: AppView) => void;
  overview: {
    toolCount: number;
    skillCount: number;
    linkCount: number;
  };
  storagePath: string;
};

const navItems: Array<{
  key: AppView;
  icon: typeof FileText;
}> = [
  { key: "skills", icon: FileText },
  { key: "tools", icon: Boxes },
  { key: "marketplace", icon: Store },
];

export function Sidebar({ activeView, labels, onSelect, overview, storagePath }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:flex md:flex-col md:border-b-0 md:border-r">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="text-lg font-bold text-gray-900">{labels.appTitle}</div>
        <div className="mt-1 text-[11px] text-gray-500 break-all">{storagePath}</div>
      </div>
      
      <div className="border-b border-gray-100 px-4 py-4 grid grid-cols-3 gap-2 text-center hidden md:grid">
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Tools</span>
          <span className="text-sm font-bold text-gray-900">{overview.toolCount}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Skills</span>
          <span className="text-sm font-bold text-gray-900">{overview.skillCount}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">Links</span>
          <span className="text-sm font-bold text-gray-900">{overview.linkCount}</span>
        </div>
      </div>

      <nav className="flex-1 flex gap-2 overflow-x-auto p-4 md:block md:space-y-2 md:overflow-y-auto">
        {navItems.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition md:w-full ${
              activeView === key
                ? "bg-indigo-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {labels[key]}
          </button>
        ))}
      </nav>
    </aside>
  );
}
