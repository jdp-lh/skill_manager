import { Bot, Wrench, Store, Command } from "lucide-react";
import { AppView } from "../store/workspaceSlice";

type SidebarProps = {
  activeView: AppView;
  labels: Record<string, string>;
  onSelect: (view: AppView) => void;
  overview: {
    agentCount: number;
    skillCount: number;
    linkCount: number;
  };
  storagePath: string;
};

const navItems: Array<{
  key: AppView;
  icon: typeof Wrench;
}> = [
  { key: "agents", icon: Bot },
  { key: "skills", icon: Wrench },
  { key: "marketplace", icon: Store },
];

export function Sidebar({ activeView, labels, onSelect, overview }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:flex md:flex-col md:border-b-0 md:border-r">
      <div className="border-b border-gray-100 px-6 py-6 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Command className="h-4 w-4" />
        </div>
        <div className="text-lg font-bold text-gray-900 tracking-tight">{labels.appTitle}</div>
      </div>
      
      <div className="border-b border-gray-100 px-4 py-4 grid grid-cols-2 gap-2 text-center hidden md:grid">
        <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50/50 border border-blue-100/50 py-2.5 transition-colors hover:bg-blue-50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Agents</span>
          <span className="text-base font-bold text-blue-950 mt-0.5">{overview.agentCount}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 border border-emerald-100/50 py-2.5 transition-colors hover:bg-emerald-50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Skills</span>
          <span className="text-base font-bold text-emerald-950 mt-0.5">{overview.skillCount}</span>
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
