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

const iconMap = {
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

type ToolIconProps = {
  icon: string;
  className?: string;
};

export function ToolIcon({ icon, className = "h-6 w-6" }: ToolIconProps) {
  const Icon = iconMap[icon as keyof typeof iconMap] || Cpu;
  return <Icon className={`text-gray-900 ${className}`} />;
}
