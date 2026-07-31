import { cn } from "../../lib/utils.js";

interface StatusBadgeProps {
  type: "status" | "priority";
  value: string;
  className?: string;
}

const TICKET_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OPEN:        { label: "Open",        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  ASSIGNED:    { label: "Assigned",    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800" },
  RESOLVED:    { label: "Resolved",    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" },
  CLOSED:      { label: "Closed",      className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW:      { label: "Low",      className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800" },
  MEDIUM:   { label: "Medium",   className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  HIGH:     { label: "High",     className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  CRITICAL: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
};

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const configMap = type === "status" ? TICKET_STATUS_CONFIG : PRIORITY_CONFIG;
  const normalizedValue = value.toUpperCase();
  const config = configMap[normalizedValue] || { label: value, className: "bg-muted text-muted-foreground border-border" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold select-none",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
export default StatusBadge;
