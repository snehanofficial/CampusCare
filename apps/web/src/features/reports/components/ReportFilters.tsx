import React from "react";
import { X, SlidersHorizontal } from "lucide-react";
import type { ReportFilters } from "../hooks/useReports.js";

interface ReportFiltersProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onReset: () => void;
}

export function ReportFilters({ filters, onChange, onReset }: ReportFiltersProps) {
  const hasFilters = Object.values(filters).some((v) => v && v !== "");

  const update = (key: keyof ReportFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {hasFilters && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              Active
            </span>
          )}
        </div>
        {hasFilters && (
          <button
            id="report-filters-reset"
            onClick={onReset}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground
              hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Start Date
          </label>
          <input
            id="report-filter-start-date"
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => update("startDate", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            End Date
          </label>
          <input
            id="report-filter-end-date"
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <select
            id="report-filter-status"
            value={filters.status ?? ""}
            onChange={(e) => update("status", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Priority
          </label>
          <select
            id="report-filter-priority"
            value={filters.priority ?? ""}
            onChange={(e) => update("priority", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Department ID */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Department ID
          </label>
          <input
            id="report-filter-department"
            type="text"
            placeholder="UUID"
            value={filters.departmentId ?? ""}
            onChange={(e) => update("departmentId", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Category ID */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Category ID
          </label>
          <input
            id="report-filter-category"
            type="text"
            placeholder="UUID"
            value={filters.categoryId ?? ""}
            onChange={(e) => update("categoryId", e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground
              placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );
}
