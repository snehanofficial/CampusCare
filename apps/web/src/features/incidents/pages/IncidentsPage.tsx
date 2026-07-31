import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { incidentRepository } from "../../../lib/repositories/incident.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockTicket } from "../../../mocks/tickets.js";
import { Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    priority: "",
  });

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["incidents", search, filters],
    queryFn: () =>
      incidentRepository.list({
        search,
        filters,
      }),
  });

  const columns: ColumnDef<MockTicket>[] = [
    {
      accessorKey: "ticketNumber",
      header: "Incident ID",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-destructive">
          {row.getValue("ticketNumber")}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Outage / Event",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("title")}</p>
          <p className="text-[10px] text-muted-foreground truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Severity",
      cell: ({ row }) => {
        const val = row.getValue("priority") as string;
        return <Tag variant="destructive">{val}</Tag>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              status === "RESOLVED" || status === "CLOSED"
                ? "bg-success/15 text-success"
                : "bg-destructive/15 text-destructive animate-pulse"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Triggered At",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => toast.info(`Viewing incident ${row.original.ticketNumber} details`)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Inspect"
          >
            <Eye className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <EntityListTemplate
      title="Critical Incidents"
      description="Active core outages and critical infrastructure breakdowns."
      columns={columns}
      data={response?.data || []}
      loading={isLoading}
      error={error ? error.message : null}
      searchQuery={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "OPEN", label: "Open" },
            { value: "IN_PROGRESS", label: "In Progress" },
            { value: "RESOLVED", label: "Resolved" },
          ],
        },
      ]}
      activeFilters={filters}
      onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
      onClearFilters={() => {
        setSearch("");
        setFilters({ status: "", priority: "" });
      }}
      actions={[
        {
          label: "Declare Incident",
          onClick: () => toast.warning("Incident declarations restricted to admins."),
          icon: AlertTriangle,
          variant: "destructive",
        },
      ]}
      pageIndex={response?.page || 1}
      pageCount={response?.pageCount || 1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default IncidentsPage;
