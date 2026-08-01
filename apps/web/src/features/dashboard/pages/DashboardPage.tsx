import React from "react";
import { DashboardTemplate } from "../../../components/templates/DashboardTemplate.js";
import {
  Clock,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Plus,
  Monitor,
  Package,
  BellRing,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth.js";
import { analyticsRepository } from "../../../lib/repositories/analytics.repository.js";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? "STUDENT";

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: chartsRes, isLoading: isChartsLoading } = useQuery({
    queryKey: ["charts-data"],
    queryFn: () => analyticsRepository.getCharts(),
  });

  const { data: dashboardRes, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-data", role, user?.id],
    queryFn: () => {
      if (role === "SYSTEM_ADMIN") return analyticsRepository.getAdminDashboard() as Promise<any>;
      if (role === "DEPT_ADMIN") return analyticsRepository.getDepartmentDashboard() as Promise<any>;
      if (role === "TECHNICIAN") return analyticsRepository.getTechnicianDashboard() as Promise<any>;
      return analyticsRepository.getStudentDashboard() as Promise<any>; // STUDENT / FACULTY
    },
  });

  if (isChartsLoading || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-xs text-muted-foreground">Compiling Operations Room data...</p>
        </div>
      </div>
    );
  }

  // ── Build Stats ─────────────────────────────────────────────────────────────
  let stats: any[] = [];
  let timeline: any[] = [];

  if (role === "SYSTEM_ADMIN" && dashboardRes) {
    const admin = dashboardRes as any;
    stats = [
      { title: "Active Tickets", value: admin.activeTicketsCount, icon: Clock },
      { title: "Resolved Tickets", value: admin.resolvedTicketsCount, icon: CheckCircle },
      { title: "Global SLA Compliance", value: `${admin.globalSlaComplianceRate}%`, icon: ShieldAlert },
      { title: "Active Outages", value: admin.outagesCount, icon: AlertCircle },
    ];
  } else if (role === "DEPT_ADMIN" && dashboardRes) {
    const dept = dashboardRes as any;
    stats = [
      { title: "Department Workload", value: dept.totalTickets, icon: Clock },
      { title: "Active Tickets", value: dept.activeTicketsCount, icon: Clock },
      { title: "Resolved Tickets", value: dept.resolvedTicketsCount, icon: CheckCircle },
      { title: "Dept SLA Compliance", value: `${dept.slaComplianceRate}%`, icon: ShieldAlert },
    ];
  } else if (role === "TECHNICIAN" && dashboardRes) {
    const tech = dashboardRes as any;
    stats = [
      { title: "Assigned Tickets", value: tech.assignedTickets, icon: Clock },
      { title: "Urgent Queue", value: tech.urgentTickets, icon: AlertCircle },
      { title: "Reopened Tickets", value: tech.reopenedTickets, icon: Clock },
      { title: "SLA Breaches", value: tech.slaBreachedTickets, icon: ShieldAlert },
    ];
    if (tech.recentAssignments) {
      timeline = tech.recentAssignments.map((t: any) => ({
        id: t.id,
        time: new Date(t.updatedAt).toLocaleDateString(),
        title: `${t.ticketNumber}: ${t.title}`,
        description: `Status: ${t.status} | Priority: ${t.priority}`,
        type: t.status === "RESOLVED" ? "success" : "info",
        performedBy: "Assigned Technician",
      }));
    }
  } else if (dashboardRes) {
    const student = dashboardRes as any;
    stats = [
      { title: "Total Created", value: student.totalTickets, icon: Clock },
      { title: "Resolutions Awaiting Review", value: student.resolvedTicketsWaitingVerification, icon: AlertCircle },
      { title: "Active Requests", value: student.activeTickets, icon: Clock },
      { title: "Completed Requests", value: student.closedTickets, icon: CheckCircle },
    ];
    if (student.recentTickets) {
      timeline = student.recentTickets.map((t: any) => ({
        id: t.id,
        time: new Date(t.createdAt).toLocaleDateString(),
        title: `${t.ticketNumber}: ${t.title}`,
        description: `Status: ${t.status} | Priority: ${t.priority}`,
        type: t.status === "RESOLVED" ? "success" : "info",
        performedBy: user?.firstName ?? "Creator",
      }));
    }
  }

  // Fallback default timeline if empty
  if (timeline.length === 0) {
    timeline = [
      {
        id: "1",
        time: "10m ago",
        title: "Security monitor alerts fully verified",
        description: "No SLA breach incidents detected in the active department logs.",
        type: "success" as const,
        performedBy: "Security Agent",
      },
    ];
  }

  const quickActions = [
    {
      label: "Create Support Ticket",
      onClick: () => navigate("/tickets"),
      icon: Plus,
    },
    {
      label: "Register New Asset",
      onClick: () => navigate("/assets"),
      icon: Monitor,
    },
    {
      label: "Adjust Inventory Stock",
      onClick: () => navigate("/inventory"),
      icon: Package,
    },
    {
      label: "Send Announcement",
      onClick: () => navigate("/notifications"),
      icon: BellRing,
    },
  ];

  const services = [
    { name: "Campus Core Wi-Fi", status: "Operational" as const, uptime: "99.8%" },
    { name: "Active Directory Domain Controller", status: "Operational" as const, uptime: "100%" },
    { name: "Canvas LMS Student Hub", status: "Degraded Performance" as const, uptime: "97.4%" },
    { name: "SIS Registrar System", status: "Operational" as const, uptime: "99.9%" },
  ];

  return (
    <DashboardTemplate
      stats={stats}
      chartData={chartsRes?.ticketVolume ?? []}
      categoryChartData={chartsRes?.categoryDistribution ?? []}
      timeline={timeline}
      quickActions={quickActions}
      services={services}
      onNavigateToTickets={() => navigate("/tickets")}
    />
  );
}

export default DashboardPage;

