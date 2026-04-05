import { Boxes, FileText, Store } from "lucide-react";
import { AppView } from "../store/workspaceSlice";

type SidebarProps = {
  activeView: AppView;
  labels: Record<string, string>;
  onSelect: (view: AppView) => void;
};

const navItems: Array<{
  key: AppView;
  icon: typeof FileText;
}> = [
  { key: "skills", icon: FileText },
  { key: "tools", icon: Boxes },
  { key: "marketplace", icon: Store },
];

export function Sidebar({ activeView, labels, onSelect }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="text-lg font-semibold text-gray-900">{labels.appTitle}</div>
        <div className="mt-1 text-sm text-gray-500">{labels.sidebarHint}</div>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-4 md:block md:space-y-2">
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
