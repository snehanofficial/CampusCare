import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { Tag } from "../../../components/ui/tag.js";
import type { ColumnDef } from "@tanstack/react-table";
import { Activity, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ServiceHealthItem {
  id: string;
  name: string;
  status: "Operational" | "Degraded Performance" | "Outage";
  uptime: string;
  latency: string;
}

const mockServices: ServiceHealthItem[] = [
  { id: "s-1", name: "Campus Core Wi-Fi Secure AP", status: "Operational", uptime: "99.8%", latency: "12ms" },
  { id: "s-2", name: "LDAP Identity Portal Auth", status: "Operational", uptime: "100%", latency: "5ms" },
  { id: "s-3", name: "Canvas LMS Student Hub", status: "Degraded Performance", uptime: "97.4%", latency: "245ms" },
  { id: "s-4", name: "SIS Registrar Enrollment Portal", status: "Operational", uptime: "99.9%", latency: "18ms" },
  { id: "s-5", name: "Exchange Outlook Email Portal", status: "Operational", uptime: "99.95%", latency: "8ms" },
];

export function ServiceStatusPage() {
  const [search, setSearch] = useState("");

  const filtered = mockServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Outage":
        return "destructive";
      case "Degraded Performance":
        return "warning";
      default:
        return "success";
    }
  };

  const columns: ColumnDef<ServiceHealthItem>[] = [
    {
      accessorKey: "name",
      header: "Service Module",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Current Health",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return <Tag variant={getStatusColor(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "uptime",
      header: "30-Day Uptime",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("uptime")}
        </span>
      ),
    },
    {
      accessorKey: "latency",
      header: "Ping Latency",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("latency")}
        </span>
      ),
    },
  ];

  return (
    <EntityListTemplate
      title="Service Health Monitor"
      description="Live uptime check and latency tracking for central university software services."
      columns={columns}
      data={filtered}
      loading={false}
      error={null}
      searchQuery={search}
      onSearchChange={setSearch}
      activeFilters={{}}
      onFilterChange={() => {}}
      onClearFilters={() => setSearch("")}
      actions={[
        {
          label: "Report Service Alert",
          onClick: () => toast.success("Submitting health log report to SysOps team..."),
          icon: Activity,
        },
      ]}
      pageIndex={1}
      pageCount={1}
      onPageChange={() => {}}
    />
  );
}
export default ServiceStatusPage;
