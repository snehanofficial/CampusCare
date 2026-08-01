import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/ui/tabs.js";
import { ServiceAvailabilityStats } from "../hooks/useServiceStatus.js";
import { Activity, BarChart2 } from "lucide-react";

export interface AvailabilityChartProps {
  stats: ServiceAvailabilityStats[];
}

export function AvailabilityChart({ stats }: AvailabilityChartProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    stats[0]?.serviceId || ""
  );

  const selectedStats = stats.find((s) => s.serviceId === selectedServiceId) || stats[0];

  if (!selectedStats) {
    return (
      <Card className="border border-border/40 bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">No availability statistics available.</p>
      </Card>
    );
  }

  const [activeTab, setActiveTab] = useState<string>("30d");

  // Filter last 7 days of daily history for the 7d tab
  const stats7d = selectedStats.dailyHistory.slice(-7);

  return (
    <Card className="border border-border/40 bg-card">
      <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/20 gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-4 text-primary" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
            Availability Analytics
          </CardTitle>
        </div>

        {/* Service Selector Dropdown */}
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="text-xs font-semibold bg-background border border-border/40 rounded px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          {stats.map((s) => (
            <option key={s.serviceId} value={s.serviceId}>
              {s.serviceName}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted p-0.5 rounded-[4px]">
              <TabsTrigger value="24h" className="text-[10px] px-3 py-1 font-bold">24 Hours</TabsTrigger>
              <TabsTrigger value="7d" className="text-[10px] px-3 py-1 font-bold">7 Days</TabsTrigger>
              <TabsTrigger value="30d" className="text-[10px] px-3 py-1 font-bold">30 Days</TabsTrigger>
            </TabsList>
            
            {/* Legend Stats */}
            <div className="flex gap-4 text-[10px]">
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground font-semibold">24h Uptime</span>
                <span className="font-extrabold text-foreground">{selectedStats.uptime24h.toFixed(2)}%</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-muted-foreground font-semibold">30d Uptime</span>
                <span className="font-extrabold text-foreground">{selectedStats.uptime30d.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* 24h Hourly Graph */}
          <TabsContent value="24h" className="focus:outline-none">
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedStats.hourlyHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <YAxis domain={[90, 100]} stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uptimeGrad)"
                    name="Hourly Uptime"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* 7d Daily Graph */}
          <TabsContent value="7d" className="focus:outline-none">
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats7d} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGrad7" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <YAxis domain={[90, 100]} stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uptimeGrad7)"
                    name="Daily Uptime"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* 30d Daily Graph */}
          <TabsContent value="30d" className="focus:outline-none">
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedStats.dailyHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uptimeGrad30" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <YAxis domain={[90, 100]} stroke="currentColor" className="text-muted-foreground text-[9px]" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "10px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="var(--success)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uptimeGrad30)"
                    name="Daily Uptime"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
