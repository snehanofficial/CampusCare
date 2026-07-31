import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "../common/PageHeader.js";
import { StatCard } from "../common/StatCard.js";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown.js";
import { BarChart3, TrendingUp, Calendar, AlertTriangle, ShieldCheck, type LucideIcon } from "lucide-react";

export interface AnalyticsMetric {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
}

export interface AnalyticsChartData {
  title: string;
  description?: string;
  data: any[];
  dataKeys: { key: string; name: string; color: string }[];
  type: "line" | "bar";
}

export interface AnalyticsPieData {
  title: string;
  data: { name: string; value: number; color: string }[];
}

interface AnalyticsTemplateProps {
  title: string;
  description?: string;
  metrics: AnalyticsMetric[];
  charts: AnalyticsChartData[];
  pieChart?: AnalyticsPieData;
}

export function AnalyticsTemplate({
  title,
  description,
  metrics,
  charts,
  pieChart,
}: AnalyticsTemplateProps) {
  const [timeRange, setTimeRange] = useState("Last 30 Days");

  return (
    <div className="space-y-6">
      {/* Header and timeframe selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <PageHeader title={title} description={description} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-9 flex items-center gap-1.5 cursor-pointer">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>Timeframe: {timeRange}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["Last 7 Days", "Last 30 Days", "This Quarter", "This Year"].map((range) => (
              <DropdownMenuItem key={range} onClick={() => setTimeRange(range)} className="text-xs">
                {range}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <StatCard
            key={idx}
            title={metric.title}
            value={metric.value}
            description={metric.subtext}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Main Graphics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Analytics Charts */}
        <div className="lg:col-span-2 space-y-6">
          {charts.map((chart, idx) => (
            <Card key={idx} className="border border-border bg-card">
              <CardHeader className="border-b border-border/40 py-4 px-6">
                <CardTitle className="text-sm font-bold text-foreground">{chart.title}</CardTitle>
                {chart.description && (
                  <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 block">
                    {chart.description}
                  </span>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    {chart.type === "line" ? (
                      <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                        {chart.dataKeys.map((dk) => (
                          <Line
                            key={dk.key}
                            type="monotone"
                            dataKey={dk.key}
                            stroke={dk.color}
                            name={dk.name}
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                        {chart.dataKeys.map((dk) => (
                          <Bar
                            key={dk.key}
                            dataKey={dk.key}
                            fill={dk.color}
                            name={dk.name}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories Pie Chart Breakdown */}
        {pieChart && (
          <div className="space-y-6">
            <Card className="border border-border bg-card h-full">
              <CardHeader className="border-b border-border/40 py-4 px-6">
                <CardTitle className="text-sm font-bold text-foreground">{pieChart.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="h-56 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChart.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieChart.data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background-card, #1e293b)",
                          borderColor: "var(--border, #334155)",
                          color: "var(--foreground, #f8fafc)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list details */}
                <div className="w-full space-y-2 mt-4">
                  {pieChart.data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-border/20 pb-1.5">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default AnalyticsTemplate;
