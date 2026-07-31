import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PageHeader } from "../common/PageHeader.js";
import { StatCard } from "../common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { ActivityTimeline, TimelineItem } from "./ActivityTimeline.js";
import { StatusBadge } from "../common/StatusBadge.js";
import {
  ArrowUpRight,
  type LucideIcon,
  Activity,
  ShieldCheck,
  Server,
  Wrench,
} from "lucide-react";

export interface DashboardStat {
  title: string;
  value: string | number;
  delta?: { value: number; isPositive: boolean };
  icon: LucideIcon;
}

export interface DashboardQuickAction {
  label: string;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "outline" | "ghost";
}

export interface DashboardServiceStatus {
  name: string;
  status: "Operational" | "Degraded Performance" | "Outage";
  uptime: string;
}

interface DashboardTemplateProps {
  stats: DashboardStat[];
  chartData: any[];
  categoryChartData: any[];
  timeline: TimelineItem[];
  quickActions?: DashboardQuickAction[];
  services?: DashboardServiceStatus[];
  onNavigateToTickets?: () => void;
}

export function DashboardTemplate({
  stats,
  chartData,
  categoryChartData,
  timeline,
  quickActions = [],
  services = [],
  onNavigateToTickets,
}: DashboardTemplateProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Operations Command Center"
        description="Real-time IT Infrastructure Health, Ticket Queue Performance, and Incident Monitor."
        actions={
          onNavigateToTickets && (
            <Button onClick={onNavigateToTickets} size="sm" className="h-8 text-xs flex items-center gap-1.5 cursor-pointer">
              <span>Ticket Queue</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          )
        }
      />

      {/* Primary KPI Metrics */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            delta={stat.delta}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Support Trend & Sidebar Activity */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Support Operations Trend */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div>
                <CardTitle>Support Ticket Throughput</CardTitle>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Comparison of opened vs. resolved tickets over the current operational cycle.
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-[10px]" />
                    <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                      }}
                    />
                    <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: "11px" }} />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOpened)"
                      name="Tickets Opened"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="var(--success)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Tickets Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Service Health */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {quickActions.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle>Operational Workflows</CardTitle>
                </CardHeader>
                <CardContent className="p-3 grid grid-cols-2 gap-2">
                  {quickActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        onClick={act.onClick}
                        className="flex flex-col items-center justify-center p-3 rounded-sm border border-border bg-surface-subtle/50 hover:bg-muted transition-colors gap-1.5 text-center group cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <div className="size-7 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="size-3.5" />
                        </div>
                        <span className="text-[11px] font-bold text-foreground truncate w-full">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {services.length > 0 && (
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle>Core Service Health</CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {services.map((srv) => (
                    <div
                      key={srv.name}
                      className="flex items-center justify-between p-2 rounded-sm bg-surface-subtle/40 border border-border/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{srv.name}</span>
                      </div>
                      <StatusBadge
                        type="status"
                        value={srv.status === "Operational" ? "RESOLVED" : srv.status === "Degraded Performance" ? "ASSIGNED" : "CRITICAL"}
                        showIcon={false}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar panels: Activity Timeline & Categories Distribution */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle>System Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline items={timeline} maxHeight="240px" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-44 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground text-[10px]" />
                    <YAxis stroke="currentColor" className="text-muted-foreground text-[10px]" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[2, 2, 0, 0]} name="Allocated Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default DashboardTemplate;
