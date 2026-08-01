import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { assetRepository } from "../../../lib/repositories/asset.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { Asset } from "@campuscare/shared-types";
import { Eye, Wrench } from "lucide-react";
import { toast } from "sonner";

export function MaintenancePage() {
  const [search, setSearch] = useState("");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["maintenance", search],
    queryFn: () =>
      assetRepository.list({
        search,
        filters: { status: "MAINTENANCE" },
      }),
  });

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "tag",
      header: "Asset Tag",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("tag")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Device Serviced",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("name")}</p>
          <p className="text-[9px] text-muted-foreground truncate">{row.original.model}</p>
        </div>
      ),
    },
    {
      accessorKey: "location",
      header: "Current Repair Depot",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("location")}
        </span>
      ),
    },
    {
      accessorKey: "purchaseDate",
      header: "Service Start Date",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {row.getValue("purchaseDate")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => toast.success(`Technician dispatch scheduled for ${row.original.tag}`)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Dispatch tech"
          >
            <Wrench className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <EntityListTemplate
      title="Maintenance Schedule"
      description="List of university hardware items currently dispatched for servicing or repairs."
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
          label: "Schedule Service",
          onClick: () => toast.info("Select an active asset from the Registry to schedule service."),
          icon: Wrench,
        },
      ]}
      pageIndex={response?.page || 1}
      pageCount={response?.pageCount || 1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default MaintenancePage;
