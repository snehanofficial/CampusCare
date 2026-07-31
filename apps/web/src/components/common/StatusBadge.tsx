import React from "react";
import { cn } from "../../lib/utils.js";
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, CircleDot, HelpCircle } from "lucide-react";

interface StatusBadgeProps {
  type: "status" | "priority" | "asset" | "sla";
  value: string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Status Badge — CampusCare semantic token system.
 * All color classes resolve through CSS variables in globals.css.
 * Zero hardcoded Tailwind color names.
 */
const CONFIG_MAP: Record<string, {
  label: string;
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  // ── Ticket / Maintenance Statuses ──
  OPEN: {
    label: "Open",
    colorClass: "cc-badge-open",
    icon: CircleDot,
  },
  ASSIGNED: {
    label: "Assigned",
    colorClass: "cc-badge-assigned",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    colorClass: "cc-badge-progress",
    icon: Clock,
  },
  RESOLVED: {
    label: "Resolved",
    colorClass: "cc-badge-resolved",
    icon: CheckCircle2,
  },
  CLOSED: {
    label: "Closed",
    colorClass: "cc-badge-neutral",
    icon: CheckCircle2,
  },

  // ── Priority Levels ──
  LOW: {
    label: "Low",
    colorClass: "cc-badge-neutral",
    icon: CircleDot,
  },
  MEDIUM: {
    label: "Medium",
    colorClass: "cc-badge-open",
    icon: CircleDot,
  },
  HIGH: {
    label: "High",
    colorClass: "cc-badge-assigned",
    icon: AlertCircle,
  },
  CRITICAL: {
    label: "Critical",
    colorClass: "cc-badge-critical",
    icon: ShieldAlert,
  },

  // ── Asset Statuses ──
  ACTIVE: {
    label: "Active",
    colorClass: "cc-badge-resolved",
    icon: CheckCircle2,
  },
  IN_MAINTENANCE: {
    label: "In Maintenance",
    colorClass: "cc-badge-assigned",
    icon: Clock,
  },
  RETIRED: {
    label: "Retired",
    colorClass: "cc-badge-neutral",
    icon: CircleDot,
  },

  // ── SLA Statuses ──
  BREACHED: {
    label: "Breached",
    colorClass: "cc-badge-critical",
    icon: ShieldAlert,
  },
  WARNING: {
    label: "Warning",
    colorClass: "cc-badge-warning",
    icon: AlertCircle,
  },
  HEALTHY: {
    label: "On Track",
    colorClass: "cc-badge-resolved",
    icon: CheckCircle2,
  },
};

export function StatusBadge({ type, value, className, showIcon = true }: StatusBadgeProps) {
  const normalizedKey = value.toUpperCase().replace(/\s+/g, "_");
  const config = CONFIG_MAP[normalizedKey] ?? {
    label: value,
    colorClass: "cc-badge-neutral",
    icon: HelpCircle,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-semibold tracking-tight transition-colors select-none",
        config.colorClass,
        className
      )}
    >
      {showIcon && <Icon className="size-3 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
export default StatusBadge;
