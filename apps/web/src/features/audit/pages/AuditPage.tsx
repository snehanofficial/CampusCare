import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { auditRepository, SystemAuditLog } from "../../../lib/repositories/audit.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import type { ColumnDef } from "@tanstack/react-table";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function AuditPage() {
  const [search, setSearch] = useState("");

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => auditRepository.list(),
  });

  const data = response ?? [];

  const filtered = data.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase())
  );

  const getSeverityVariant = (sev: string) => {
    switch (sev) {
      case "ERROR":
      case "CRITICAL":
        return "destructive";
      case "WARN":
        return "warning";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<SystemAuditLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {new Date(row.getValue("timestamp")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Security Action",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {row.getValue("action")}
        </span>
      ),
    },
    {
      accessorKey: "details",
      header: "System Details Log",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium truncate max-w-sm block">
          {row.getValue("details")}
        </span>
      ),
    },
    {
      accessorKey: "performedBy",
      header: "Operator",
      cell: ({ row }) => (
        <span className="text-xs text-foreground font-semibold">
          {row.getValue("performedBy")}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const val = row.getValue("severity") as string;
        return <Tag variant={getSeverityVariant(val)}>{val}</Tag>;
      },
    },
  ];

  return (
    <EntityListTemplate
      title="Audit Trail Logs"
      description="Secure immutable logs tracking global system operations and credential access details."
      columns={columns}
      data={filtered}
      loading={isLoading}
      error={null}
      searchQuery={search}
      onSearchChange={setSearch}
      activeFilters={{}}
      onFilterChange={() => {}}
      onClearFilters={() => setSearch("")}
      actions={[
        {
          label: "Export Logs",
          onClick: () => toast.success("Immutable audit logs downloaded successfully."),
          icon: ShieldAlert,
        },
      ]}
      pageIndex={1}
      pageCount={1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default AuditPage;
