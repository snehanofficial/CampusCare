import React, { useState, useCallback } from "react";
import {
  RefreshCw,
  History,
  TrendingUp,
  Download,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  FileBarChart,
} from "lucide-react";
import { ReportCard } from "../components/ReportCard.js";
import { ExportMenu } from "../components/ExportMenu.js";
import { ReportPreview } from "../components/ReportPreview.js";
import {
  useAvailableReports,
  useGenerateReport,
  useExportReport,
  useReportHistory,
  type ReportType,
  type ExportFormat,
  type ReportFilters,
} from "../hooks/useReports.js";

// ─── Inline Filters ───────────────────────────────────────────────────────────

function FilterRow({
  filters,
  onChange,
  onReset,
}: {
  filters: ReportFilters;
  onChange: (f: ReportFilters) => void;
  onReset: () => void;
}) {
  const update = (key: keyof ReportFilters, val: string) =>
    onChange({ ...filters, [key]: val || undefined });

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range */}
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-2">
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          id="filter-start-date"
          type="date"
          value={filters.startDate ?? ""}
          onChange={(e) => update("startDate", e.target.value)}
          className="w-28 bg-transparent text-[11px] text-foreground focus:outline-none"
        />
        <span className="text-muted-foreground/40">→</span>
        <input
          id="filter-end-date"
          type="date"
          value={filters.endDate ?? ""}
          onChange={(e) => update("endDate", e.target.value)}
          className="w-28 bg-transparent text-[11px] text-foreground focus:outline-none"
        />
      </div>

      {/* Status */}
      <select
        id="filter-status"
        value={filters.status ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-lg border border-border bg-card/60 px-3 py-2 text-[11px] text-foreground
          focus:border-primary focus:outline-none"
      >
        <option value="">All Statuses</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>

      {/* Priority */}
      <select
        id="filter-priority"
        value={filters.priority ?? ""}
        onChange={(e) => update("priority", e.target.value)}
        className="rounded-lg border border-border bg-card/60 px-3 py-2 text-[11px] text-foreground
          focus:border-primary focus:outline-none"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      {hasFilters && (
        <button
          id="filter-reset"
          onClick={onReset}
          className="rounded-lg border border-border px-3 py-2 text-[11px] text-muted-foreground
            hover:border-primary/40 hover:text-foreground transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryPanel({ entries }: { entries: ReturnType<typeof useReportHistory>["data"] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/40 py-8 text-center text-xs text-muted-foreground">
        No export history yet. Generate and export a report to see it here.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/60 divide-y divide-border overflow-hidden">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
          <FileBarChart className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {entry.type.replace(/_/g, " ")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {entry.generatedBy} · {new Date(entry.generatedAt).toLocaleString()}
            </p>
          </div>
          {entry.exportFormat && (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {entry.exportFormat}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [generateEnabled, setGenerateEnabled] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");

  const { data: availableReports, isLoading: loadingCatalog } = useAvailableReports();
  const {
    data: reportData,
    isLoading: loadingReport,
    error: reportError,
    refetch,
  } = useGenerateReport(selectedType, filters, generateEnabled);

  const { mutate: exportReport, isPending: isExporting } = useExportReport();
  const { data: history } = useReportHistory();

  const handleSelect = useCallback((type: ReportType) => {
    setSelectedType(type);
    setGenerateEnabled(false);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!selectedType) return;
    setGenerateEnabled(true);
    refetch();
  }, [selectedType, refetch]);

  const handleExport = useCallback(
    (type: ReportType, format: ExportFormat) => {
      exportReport({ type, format, filters });
    },
    [exportReport, filters]
  );

  const handleFilterReset = useCallback(() => {
    setFilters({});
    setGenerateEnabled(false);
  }, []);

  return (
    <div className="flex min-h-full flex-col p-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Reports Engine</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Generate and export operational reports across all campus IT data.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
            <button
              id="tab-generate"
              onClick={() => setActiveTab("generate")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "generate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Generate
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "history"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* ─── History Tab ──────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Showing the last {history?.length ?? 0} report generations in this session.
          </p>
          <HistoryPanel entries={history} />
        </div>
      )}

      {/* ─── Generate Tab ─────────────────────────────────────────────────── */}
      {activeTab === "generate" && (
        <div className="flex flex-col gap-6">

          {/* ── Section: Available Reports (2 rows × 3 cols) ─────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Available Reports
              </h2>
              {selectedType && (
                <span className="text-[10px] text-muted-foreground">
                  Selected:{" "}
                  <span className="font-semibold text-foreground">
                    {selectedType.replace(/_/g, " ")}
                  </span>
                </span>
              )}
            </div>

            {/* 3-column, 2-row grid */}
            {loadingCatalog ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/30" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {(availableReports ?? []).map((report) => (
                  <ReportCard
                    key={report.type}
                    report={report}
                    isSelected={selectedType === report.type}
                    onSelect={handleSelect}
                    onExport={handleExport}
                    isExporting={isExporting}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Actions Bar ──────────────────────────────────────── */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
            {/* Top row: filter toggle + generate + export */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter toggle */}
              <button
                id="toggle-filters"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium
                  transition-all ${
                    showFilters
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {showFilters ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {/* Generate */}
              <button
                id="btn-generate"
                onClick={handleGenerate}
                disabled={!selectedType || loadingReport}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold
                  text-primary-foreground shadow-sm transition-all hover:bg-primary/90
                  disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingReport ? "animate-spin" : ""}`} />
                {loadingReport ? "Generating…" : "Generate Report"}
              </button>

              {/* Export buttons — only when a type is selected */}
              {selectedType && (
                <div className="flex items-center gap-2 ml-auto">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Export as:</span>
                  {(["PDF", "EXCEL", "CSV"] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      id={`export-btn-${fmt.toLowerCase()}`}
                      disabled={isExporting}
                      onClick={() => handleExport(selectedType, fmt)}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-[10px] font-bold
                        uppercase tracking-wider text-muted-foreground transition-all
                        hover:border-primary/40 hover:bg-primary/5 hover:text-foreground
                        disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isExporting ? "…" : fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible filter row */}
            {showFilters && (
              <div className="border-t border-border pt-3">
                <FilterRow
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleFilterReset}
                />
              </div>
            )}
          </div>

          {/* ── Section: Preview ──────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {reportData
                  ? `Preview — ${selectedType?.replace(/_/g, " ")}`
                  : "Report Preview"}
              </h2>
              {reportData && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  Ready
                </span>
              )}
            </div>
            <ReportPreview
              reportType={selectedType ?? ""}
              data={reportData ?? null}
              isLoading={loadingReport}
              error={reportError ? (reportError as Error).message : null}
              onGenerate={handleGenerate}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
