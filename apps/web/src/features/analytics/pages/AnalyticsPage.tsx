import React from "react";
import { AnalyticsTemplate } from "../../../components/templates/AnalyticsTemplate.js";
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { mockTicketVolumeData, mockCategoryData, mockMttrData } from "../../../mocks/analytics.js";

export function AnalyticsPage() {
  const metrics = [
    {
      title: "MTTR Average",
      value: "2.8 Hours",
      subtext: "Down from 4.8 hrs this month",
      icon: Clock,
    },
    {
      title: "SLA Response Rate",
      value: "94.6%",
      subtext: "Target rate: 95.0%",
      icon: ShieldCheck,
    },
    {
      title: "Total Tickets Serviced",
      value: "148",
      subtext: "+15% increase vs. June",
      icon: TrendingUp,
    },
    {
      title: "Active Service Alerts",
      value: "1 Outage",
      subtext: "Canvas LMS reports degrading",
      icon: AlertTriangle,
    },
  ];

  const charts = [
    {
      title: "Ticket Load Volume Details",
      description: "Comparison between incoming support requests logged vs. resolved daily.",
      data: mockTicketVolumeData,
      dataKeys: [
        { key: "opened", name: "Opened", color: "var(--color-primary, #3b82f6)" },
        { key: "resolved", name: "Resolved", color: "var(--color-success, #10b981)" },
      ],
      type: "line" as const,
    },
    {
      title: "Mean Time to Resolution (MTTR) Trend",
      description: "Average hours spent per week resolving incident cards.",
      data: mockMttrData,
      dataKeys: [
        { key: "hours", name: "Resolution Hours", color: "var(--color-warning, #f59e0b)" },
      ],
      type: "bar" as const,
    },
  ];

  const pieChart = {
    title: "Ticket Distribution by Module",
    data: mockCategoryData,
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
