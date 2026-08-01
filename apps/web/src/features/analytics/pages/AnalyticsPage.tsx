import React from "react";
import { AnalyticsTemplate } from "../../../components/templates/AnalyticsTemplate.js";
import { TrendingUp, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsRepository } from "../../../lib/repositories/analytics.repository.js";

export function AnalyticsPage() {
  const { data: chartsRes, isLoading: isChartsLoading } = useQuery({
    queryKey: ["analytics-charts"],
    queryFn: () => analyticsRepository.getCharts(),
  });

  const { data: adminRes, isLoading: isAdminLoading } = useQuery({
    queryKey: ["analytics-admin-stats"],
    queryFn: () => analyticsRepository.getAdminDashboard(),
  });

  if (isChartsLoading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted-foreground">Gathering operations statistics...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Active Outages",
      value: `${adminRes?.outagesCount ?? 0} Outages`,
      subtext: "High & Critical severity events",
      icon: AlertTriangle,
    },
    {
      title: "SLA Compliance Rate",
      value: `${adminRes?.globalSlaComplianceRate ?? 100}%`,
      subtext: "System target: 95.0%",
      icon: ShieldCheck,
    },
    {
      title: "Active Workload Queue",
      value: adminRes?.activeTicketsCount ?? 0,
      subtext: "Active support request cards",
      icon: Clock,
    },
    {
      title: "Total Resolved & Closed",
      value: (adminRes?.resolvedTicketsCount ?? 0) + (adminRes?.closedTicketsCount ?? 0),
      subtext: "Cumulative resolved issues",
      icon: TrendingUp,
    },
  ];

  const charts = [
    {
      title: "Ticket Load Volume Details",
      description: "Comparison between incoming support requests logged vs. resolved daily.",
      data: chartsRes?.ticketVolume ?? [],
      dataKeys: [
        { key: "opened", name: "Opened", color: "var(--color-primary, #3b82f6)" },
        { key: "resolved", name: "Resolved", color: "var(--color-success, #10b981)" },
      ],
      type: "line" as const,
    },
    {
      title: "Mean Time to Resolution (MTTR) Trend",
      description: "Average hours spent per week resolving incident cards.",
      data: chartsRes?.mttrTrend ?? [],
      dataKeys: [
        { key: "hours", name: "Resolution Hours", color: "var(--color-warning, #f59e0b)" },
      ],
      type: "bar" as const,
    },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const formattedPieData = (chartsRes?.categoryDistribution ?? []).map((c, idx) => ({
    name: c.name,
    value: c.value,
    color: c.color || COLORS[idx % COLORS.length]!,
  }));

  const pieChart = {
    title: "Ticket Distribution by Module Category",
    data: formattedPieData,
  };


  return (
    <AnalyticsTemplate
      title="Intelligence & Analytics"
      description="Interactive metrics monitors and historical compliance curves."
      metrics={metrics}
      charts={charts}
      pieChart={pieChart}
    />
  );
}

export default AnalyticsPage;

