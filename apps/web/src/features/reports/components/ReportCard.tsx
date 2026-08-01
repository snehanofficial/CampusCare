import React from "react";
import {
  FileText,
  BarChart3,
  Package,
  Wrench,
  Clock,
  AlertTriangle,
  Download,
  ArrowRight,
} from "lucide-react";
import type { ReportDefinition, ReportType, ExportFormat } from "../hooks/useReports.js";

interface ReportCardProps {
  report: ReportDefinition;
  isSelected: boolean;
  onSelect: (type: ReportType) => void;
  onExport: (type: ReportType, format: ExportFormat) => void;
  isExporting: boolean;
}

const REPORT_META: Record<
  ReportType,
  { icon: React.ElementType; accent: string; bg: string; border: string; badge: string }
> = {
  TICKET_REPORT: {
    icon: FileText,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-400/50",
    badge: "bg-blue-500/15 text-blue-300",
  },
  ASSET_REPORT: {
    icon: BarChart3,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-400/50",
    badge: "bg-emerald-500/15 text-emerald-300",
  },
  INVENTORY_REPORT: {
    icon: Package,
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-400/50",
    badge: "bg-violet-500/15 text-violet-300",
  },
  MAINTENANCE_REPORT: {
    icon: Wrench,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-400/50",
    badge: "bg-amber-500/15 text-amber-300",
  },
  SLA_REPORT: {
    icon: Clock,
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20 hover:border-cyan-400/50",
    badge: "bg-cyan-500/15 text-cyan-300",
  },
  INCIDENT_REPORT: {
    icon: AlertTriangle,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-400/50",
    badge: "bg-rose-500/15 text-rose-300",
  },
};

export function ReportCard({
  report,
  isSelected,
  onSelect,
  onExport,
  isExporting,
}: ReportCardProps) {
  const meta = REPORT_META[report.type];
  const Icon = meta.icon;

  return (
    <div
      id={`report-card-${report.type.toLowerCase()}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(report.type)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(report.type)}
      className={`
        group relative flex flex-col rounded-2xl border bg-card/50 p-5
        cursor-pointer transition-all duration-200 backdrop-blur-sm outline-none
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10
        focus-visible:ring-2 focus-visible:ring-primary/40
        ${meta.border}
        ${isSelected
          ? "ring-2 ring-inset ring-primary/60 border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
          : ""}
      `}
    >
      {/* Selected indicator strip */}
      {isSelected && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      )}

      {/* Icon + Format badges row */}
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${meta.bg}`}>
          <Icon className={`h-5 w-5 ${meta.accent}`} />
        </div>
        <div className="flex gap-1">
          {report.supportedFormats.map((fmt) => (
            <button
              key={fmt}
              id={`export-${report.type.toLowerCase()}-${fmt.toLowerCase()}`}
              disabled={isExporting}
              onClick={(e) => {
                e.stopPropagation();
                onExport(report.type, fmt);
              }}
              className={`
                rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider
                transition-all duration-150 border
                ${meta.badge} border-current/20
                hover:scale-105 hover:opacity-100 opacity-70
                disabled:cursor-not-allowed disabled:opacity-40
              `}
            >
              {isExporting ? "…" : fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-sm font-semibold text-foreground leading-tight">
        {report.name}
      </h3>

      {/* Description */}
      <p className="mb-4 flex-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
        {report.description}
      </p>

      {/* Metrics chips */}
      <div className="flex flex-wrap gap-1">
        {report.metrics.slice(0, 2).map((m) => (
          <span
            key={m}
            className="rounded-md bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
          >
            {m}
          </span>
        ))}
        {report.metrics.length > 2 && (
          <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[9px] text-muted-foreground/60">
            +{report.metrics.length - 2}
          </span>
        )}
      </div>

      {/* View Report CTA — appears on hover */}
      <div
        className={`
          mt-3 flex items-center gap-1 text-[10px] font-semibold transition-all duration-200
          ${meta.accent} opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100
          ${isSelected ? "opacity-100" : ""}
        `}
      >
        <ArrowRight className="h-3 w-3" />
        {isSelected ? "Selected — click Generate below" : "Click to select"}
      </div>
    </div>
  );
}
