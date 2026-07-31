import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { assetRepository } from "../../../lib/repositories/asset.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockAsset } from "../../../mocks/assets.js";
import { Eye, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export function AssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [model, setModel] = useState("");
  const [location, setLocation] = useState("");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["assets", search, filters],
    queryFn: () =>
      assetRepository.list({
        search,
        filters,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (variables: Partial<MockAsset>) => assetRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset registered successfully.");
      setIsCreateOpen(false);
      setName("");
      setTag("");
      setModel("");
      setLocation("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset removed from registry.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, tag, model, location });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "OPERATIONAL":
      case "DEPLOYED":
        return "success";
      case "MAINTENANCE":
        return "warning";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<MockAsset>[] = [
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
      header: "Device Name",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground truncate">{row.getValue("name")}</p>
          <p className="text-[9px] text-muted-foreground truncate">{row.original.model}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return <Tag variant={getStatusColor(val)}>{val}</Tag>;
      },
    },
    {
      accessorKey: "location",
      header: "Room / Location",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("location")}
        </span>
      ),
    },
    {
      accessorKey: "warrantyExpiry",
      header: "Warranty Expiry",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {row.getValue("warrantyExpiry")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => toast.info(`Asset serial: ${row.original.serialNumber}`)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Inspect"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={() => deleteMutation.mutate(row.original.id)}
            className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
            title="Delete"
          >
            <Trash className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="Asset Registry"
        description="University hardware and IT asset tracking index."
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
              { value: "OPERATIONAL", label: "Operational" },
              { value: "DEPLOYED", label: "Deployed" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "DECOMMISSIONED", label: "Decommissioned" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onClearFilters={() => {
          setSearch("");
          setFilters({ status: "" });
        }}
        actions={[
          {
            label: "Register Asset",
            onClick: () => setIsCreateOpen(true),
            icon: Plus,
          },
        ]}
        pageIndex={response?.page || 1}
        pageCount={response?.pageCount || 1}
        onPageChange={() => {}}
        onRetry={refetch}
      />

      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Campus Asset"
        description="Add a new workstation, tablet, or server to the hardware registry database."
        onSubmit={handleCreate}
        submitLabel="Register Asset"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS Lab 3 Workstation #24"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Asset Tag</label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. CC-LAP-9023"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Model / Brand</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Dell OptiPlex 7090 SFF"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Room / Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CS Building Room 304"
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default AssetsPage;
