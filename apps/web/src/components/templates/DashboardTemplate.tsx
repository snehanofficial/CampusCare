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
import {
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  HelpCircle,
  Activity,
  ArrowUpRight,
  type LucideIcon,
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
  const getServiceColor = (status: string) => {
    switch (status) {
      case "Outage":
        return "bg-destructive";
      case "Degraded Performance":
        return "bg-warning";
      default:
        return "bg-success";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Dashboard Overview"
          description="CampusCare IT Service Desk Operations & Infrastructure Health."
        />
        {onNavigateToTickets && (
          <Button onClick={onNavigateToTickets} size="sm" className="text-xs h-9 flex items-center gap-1.5 cursor-pointer">
            <span>View Ticket Queue</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Main Graphics charts and activity timelines */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Operations Chart (Recharts Area) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-6">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Support Operations Trend</CardTitle>
                <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 block">
                  Weekly overview of support tickets generated vs. resolved.
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success, #10b981)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-success, #10b981)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background-card, #1e293b)",
                        borderColor: "var(--border, #334155)",
                        color: "var(--foreground, #f8fafc)",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="opened"
                      stroke="var(--color-primary, #3b82f6)"
                      fillOpacity={1}
                      fill="url(#colorOpened)"
                      name="Tickets Opened"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="var(--color-success, #10b981)"
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                      name="Tickets Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel & Service Status */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Quick Actions */}
            {quickActions.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="border-b border-border/40 py-4 px-6">
                  <CardTitle className="text-sm font-bold text-foreground">Operational Workflows</CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-2 gap-3">
                  {quickActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        onClick={act.onClick}
                        className="flex flex-col items-center justify-center p-4 rounded-lg border border-border/60 bg-muted/10 hover:bg-muted/40 transition-colors gap-2 text-center group cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <div className="size-8 rounded bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className="size-4" />
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

            {/* Service Status */}
            {services.length > 0 && (
              <Card className="border border-border bg-card">
                <CardHeader className="border-b border-border/40 py-4 px-6">
                  <CardTitle className="text-sm font-bold text-foreground">Service Health Monitor</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {services.map((srv) => (
                    <div
                      key={srv.name}
                      className="flex items-center justify-between p-2.5 rounded-md bg-muted/20 border border-border/40"
                    >
                      <span className="text-xs font-semibold text-foreground">{srv.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${getServiceColor(srv.status)}`} />
                        <span className="text-[10px] text-muted-foreground font-medium">{srv.status}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar panels: Activity Timeline & Categories Bar Chart */}
        <div className="space-y-6">
          {/* Recent Activity Timeline */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 py-4 px-6">
              <CardTitle className="text-sm font-bold text-foreground">Recent Event Log</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityTimeline items={timeline} maxHeight="220px" />
            </CardContent>
          </Card>

          {/* Ticket Categories Bar Chart */}
          <Card className="border border-border bg-card">
            <CardHeader className="border-b border-border/40 py-4 px-6">
              <CardTitle className="text-sm font-bold text-foreground">Categories Allocation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-44 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background-card, #1e293b)",
                        borderColor: "var(--border, #334155)",
                        color: "var(--foreground, #f8fafc)",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-primary, #3b82f6)" radius={[4, 4, 0, 0]} name="Allocated Tickets" />
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
