import {
  Bot,
  Boxes,
  Code2,
  Cpu,
  PanelLeft,
  Sparkles,
  TerminalSquare,
  Wind,
  Workflow,
  Wrench,
} from "lucide-react";

const Claude = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#D97757" />
    <path d="M16 17L12 10L8 17H6.5L12 7.5L17.5 17H16ZM12 13.5L10 17H14L12 13.5Z" fill="#FFF" />
  </svg>
);

const Trae = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trae-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#trae-grad)" />
    <path d="M8 8h8v2H8V8zm3 2v8h2v-8h-2z" fill="#FFF" />
  </svg>
);

const Codex = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#10A37F" />
    <path d="M16.5 10.5V13.5H13.5V16.5H10.5V13.5H7.5V10.5H10.5V7.5H13.5V10.5H16.5Z" fill="#FFF" />
  </svg>
);

const Cursor = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#111827" />
    <path d="M9 7L16 14.5L13 15.5L15 19L13.5 20L11.5 16.5L9 18.5V7Z" fill="#FFF" />
  </svg>
);

const Copilot = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#1F2328" />
    <path d="M12 6c-3.3 0-6 2.7-6 6v4h12v-4c0-3.3-2.7-6-6-6z" stroke="#FFF" strokeWidth="2" />
    <path d="M9 13h1M14 13h1" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChatGPT = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#74AA9C" />
    <path d="M12 6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6zm0 2a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4 4 4 0 00-4-4z" fill="#FFF" />
    <circle cx="12" cy="12" r="2" fill="#FFF" />
  </svg>
);

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Claude,
  Trae,
  Codex,
  Cursor,
  Copilot,
  ChatGPT,
  Bot,
  Boxes,
  Code2,
  Cpu,
  PanelLeft,
  Sparkles,
  TerminalSquare,
  Wind,
  Workflow,
  Wrench,
};

export const AVAILABLE_ICONS = Object.keys(iconMap);

type ToolIconProps = {
  icon: string;
  className?: string;
};

export function ToolIcon({ icon, className = "h-6 w-6" }: ToolIconProps) {
  const Icon = iconMap[icon] || Cpu;
  return <Icon className={className} />;
}
