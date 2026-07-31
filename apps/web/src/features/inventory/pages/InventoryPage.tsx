import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { inventoryRepository } from "../../../lib/repositories/inventory.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockInventoryItem } from "../../../mocks/inventory.js";
import { Plus, Sliders } from "lucide-react";
import { toast } from "sonner";

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    lowStock: "",
  });

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory", search, filters],
    queryFn: () =>
      inventoryRepository.list({
        search,
        filters,
      }),
  });

  const columns: ColumnDef<MockInventoryItem>[] = [
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("sku")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Part Name",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground truncate">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Stock Level",
      cell: ({ row }) => {
        const val = row.getValue("quantity") as number;
        const minVal = row.original.minQuantity;
        const isLow = val <= minVal;

        return (
          <span
            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold ${
              isLow ? "bg-destructive/15 text-destructive animate-pulse" : "bg-success/15 text-success"
            }`}
          >
            {val} in stock
          </span>
        );
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          ${(row.getValue("unitPrice") as number).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "location",
      header: "Shelf Location",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("location")}
        </span>
      ),
    },
  ];

  return (
    <EntityListTemplate
      title="Inventory Tracker"
      description="Spare parts and IT infrastructure storage inventory monitoring."
      columns={columns}
      data={response?.data || []}
      loading={isLoading}
      error={error ? error.message : null}
      searchQuery={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "lowStock",
          label: "Threshold Alert",
          options: [
            { value: "true", label: "Low Stock Alerts" },
          ],
        },
      ]}
      activeFilters={filters}
      onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
      onClearFilters={() => {
        setSearch("");
        setFilters({ lowStock: "" });
      }}
      actions={[
        {
          label: "Replenish Stock",
          onClick: () => toast.info("Select stock item to log order."),
          icon: Plus,
        },
      ]}
      pageIndex={response?.page || 1}
      pageCount={response?.pageCount || 1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default InventoryPage;
