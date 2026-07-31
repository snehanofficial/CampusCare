import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { reportRepository } from "../../../lib/repositories/report.repository.js";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockReport } from "../../../mocks/reports.js";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";

export function ReportsPage() {
  const [search, setSearch] = useState("");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["reports", search],
    queryFn: () =>
      reportRepository.list({
        search,
      }),
  });

  const columns: ColumnDef<MockReport>[] = [
    {
      accessorKey: "name",
      header: "Report Title",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("name")}</p>
          <p className="text-[10px] text-muted-foreground truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Metrics Focus",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {row.getValue("type")}
        </span>
      ),
    },
    {
      accessorKey: "generatedBy",
      header: "Author",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.getValue("generatedBy")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase select-none ${
              val === "READY" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}
          >
            {val}
          </span>
        );
      },
    },
    {
      id: "download",
      header: "Download",
      cell: ({ row }) => {
        const url = row.original.downloadUrl;
        return url ? (
          <button
            onClick={() => toast.success(`Initiating download for: ${row.original.name}`)}
            className="p-1 hover:bg-primary/10 text-primary rounded cursor-pointer focus:outline-none"
            title="Download PDF/Excel"
          >
            <FileDown className="size-4" />
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground select-none">Compiling...</span>
        );
      },
    },
  ];

  return (
    <EntityListTemplate
      title="Audit Reports"
      description="Select template profiles to export support statistics, hardware logs, or compliance breakdowns."
      columns={columns}
      data={response?.data || []}
      loading={isLoading}
      error={error ? error.message : null}
      searchQuery={search}
      onSearchChange={setSearch}
      activeFilters={{}}
      onFilterChange={() => {}}
      onClearFilters={() => setSearch("")}
      actions={[
        {
          label: "Generate Report",
          onClick: () => toast.info("Select parameters to trigger compilation queue."),
          icon: FileText,
        },
      ]}
      pageIndex={response?.page || 1}
      pageCount={response?.pageCount || 1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default ReportsPage;
