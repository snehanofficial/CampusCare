import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { categoryRepository, MockCategory } from "../../../lib/repositories/category.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Tag } from "../../../components/ui/tag.js";
import { FolderTree, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    active: "",
  });

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sla, setSla] = useState("8");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["categories", search, filters],
    queryFn: () =>
      categoryRepository.list({
        search,
        filters,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (variables: Partial<MockCategory>) => categoryRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Ticket category added successfully.");
      setIsOpen(false);
      setName("");
      setCode("");
      setSla("8");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    createMutation.mutate({ name, code, defaultSlaHours: parseInt(sla, 10), active: true });
  };

  const columns: ColumnDef<MockCategory>[] = [
    {
      accessorKey: "code",
      header: "Code Prefix",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "defaultSlaHours",
      header: "Default SLA (hrs)",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {row.getValue("defaultSlaHours")} hours
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const val = row.getValue("active") as boolean;
        return <Tag variant={val ? "success" : "secondary"}>{val ? "Active" : "Disabled"}</Tag>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => deleteMutation.mutate(row.original.id)}
          className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
          title="Delete"
        >
          <Trash className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="Ticket Categories"
        description="Configure ticket classifications and standard resolution SLA targets."
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            key: "active",
            label: "State Filter",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Disabled" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onClearFilters={() => {
          setSearch("");
          setFilters({ active: "" });
        }}
        actions={[
          {
            label: "Create Category",
            onClick: () => setIsOpen(true),
            icon: Plus,
          },
        ]}
        pageIndex={response?.page || 1}
        pageCount={response?.pageCount || 1}
        onPageChange={() => {}}
        onRetry={refetch}
      />

      <CRUDDialogTemplate
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Ticket Category"
        description="Add a new ticket categorization node."
        onSubmit={handleSubmit}
        submitLabel="Create Category"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software License Issuance"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Category Code Prefix</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SOFT_LIC"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Default SLA Limit (hours)</label>
            <Input
              value={sla}
              onChange={(e) => setSla(e.target.value)}
              type="number"
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default CategoriesPage;
