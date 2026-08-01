import React from "react";
import { Loader2, TrendingUp, TrendingDown, BarChart2, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ReportPreviewProps {
  reportType: string;
  data: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === "All time") return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    // Check if it includes time info
    if (dateStr.includes("T") || dateStr.includes(":") || dateStr.length > 10) {
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground truncate" title={String(value)}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DistributionChart({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).map(([name, value]) => ({ name, value }));
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold text-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={entries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 11,
            }}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieDistribution({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).map(([name, value]) => ({ name, value }));
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-xs font-semibold text-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={entries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={false}>
            {entries.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: 11,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportPreview({ reportType, data, isLoading, error, onGenerate }: ReportPreviewProps) {
  if (!data && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <BarChart2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Select a report type above</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Click a report card then press Generate to see data
        </p>
        <button
          id="report-preview-generate"
          onClick={onGenerate}
          disabled={!reportType}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold
            text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Generate Report
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Generating report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
        <TrendingDown className="mx-auto mb-2 h-8 w-8 text-rose-400" />
        <p className="text-sm font-semibold text-rose-400">Failed to generate report</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{error}</p>
        <button
          onClick={onGenerate}
          className="mt-3 rounded-lg bg-rose-500/20 px-4 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Extract inner payload & metadata
  const reportPayload = (data.data || {}) as Record<string, unknown>;
  const generatedAtStr = data.generatedAt as string | undefined;
  const formattedTime = generatedAtStr ? formatDate(generatedAtStr) : "N/A";
  
  const period = data.data && typeof data.data === "object" && "period" in (data.data as object)
    ? (data.data as any).period
    : null;
    
  const formattedPeriod = period
    ? `${formatDate(period.start)} — ${formatDate(period.end)}`
    : null;

  // Build KPI cards and charts from report data dynamically
  const kpiFields: { label: string; value: unknown }[] = [];
  const distributions: { key: string; value: Record<string, number> }[] = [];

  for (const [key, value] of Object.entries(reportPayload)) {
    if (key === "period" || key === "recentTransactions" || key === "lowStockItems") continue;

    if (typeof value === "number" || typeof value === "string") {
      kpiFields.push({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
        value,
      });
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const vals = value as Record<string, unknown>;
      const allNumbers = Object.values(vals).every((v) => typeof v === "number");
      if (allNumbers && Object.keys(vals).length > 0) {
        distributions.push({ key, value: vals as Record<string, number> });
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/40 px-4 py-2.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Generated at:</span>
          <span className="font-semibold text-foreground">{formattedTime}</span>
        </div>
        {formattedPeriod && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Report Period:</span>
            <span className="font-semibold text-foreground">{formattedPeriod}</span>
          </div>
        )}
      </div>

      {/* KPI Summary Row */}
      {kpiFields.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {kpiFields.slice(0, 6).map((kpi) => {
            const rawVal = kpi.value as string | number | null | undefined;
            const displayVal =
              typeof rawVal === "number" && String(rawVal).includes(".")
                ? `${rawVal}${kpi.label.toLowerCase().includes("percent") ? "%" : "h"}`
                : String(rawVal ?? "—");
            return <KpiCard key={kpi.label} label={kpi.label} value={displayVal} />;
          })}
        </div>
      ) : null}

      {/* Distribution Charts */}
      {distributions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {distributions.slice(0, 2).map((dist) => (
            <DistributionChart
              key={dist.key}
              title={dist.key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              data={dist.value}
            />
          ))}
          {distributions.slice(2, 4).map((dist) => (
            <PieDistribution
              key={dist.key}
              title={dist.key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              data={dist.value}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

