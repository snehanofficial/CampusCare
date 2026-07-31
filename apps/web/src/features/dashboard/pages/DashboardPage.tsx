import React, { useState, useEffect } from "react";
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
import { mockTicketVolumeData, mockCategoryData, mockNotifications } from "../../../mocks/index.js";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Open Tickets",
      value: "6",
      delta: { value: 12.5, isPositive: false },
      icon: Clock,
    },
    {
      title: "Critical Incidents",
      value: "2",
      delta: { value: 50.0, isPositive: false },
      icon: ShieldAlert,
    },
    {
      title: "Active Assets",
      value: "1,248",
      delta: { value: 1.2, isPositive: true },
      icon: CheckCircle,
    },
    {
      title: "Pending Approvals",
      value: "3",
      icon: AlertCircle,
    },
  ];

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
    { name: "Exchange Campus Email", status: "Operational" as const, uptime: "99.95%" },
  ];

  const timeline = [
    {
      id: "1",
      time: "10m ago",
      title: "Ticket INC-1029 assigned to Network Support Team",
      description: "Sarah Technician updated ticket owner group to Tier-2 support.",
      type: "info" as const,
      performedBy: "Sarah Technician",
    },
    {
      id: "2",
      time: "1h ago",
      title: "Wi-Fi access point in Library restarted",
      description: "Automated alert resolution. Heartbeat ping restored on AP-LIB-02.",
      type: "success" as const,
      performedBy: "System Daemon",
    },
    {
      id: "3",
      time: "3h ago",
      title: "New asset tag #CC-LAP-4029 registered",
      description: "Lenovo ThinkPad L14 added to inventory registry under IT department.",
      type: "info" as const,
      performedBy: "Alex Admin",
    },
    {
      id: "4",
      time: "1d ago",
      title: "SLA response warning triggered for INC-1025",
      description: "Response limit breached. Priority ticket remained unassigned for > 2 hours.",
      type: "warn" as const,
      performedBy: "SLA Monitor Service",
    },
  ];

  return (
    <DashboardTemplate
      stats={stats}
      chartData={mockTicketVolumeData}
      categoryChartData={mockCategoryData}
      timeline={timeline}
      quickActions={quickActions}
      services={services}
      onNavigateToTickets={() => navigate("/tickets")}
    />
  );
}
export default DashboardPage;
