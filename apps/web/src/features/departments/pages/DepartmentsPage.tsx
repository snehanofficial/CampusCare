import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { departmentRepository, MockDepartment } from "../../../lib/repositories/department.repository.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Input } from "../../../components/ui/input.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["departments", search],
    queryFn: () =>
      departmentRepository.list({
        search,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (variables: Partial<MockDepartment>) => departmentRepository.create(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully.");
      setIsOpen(false);
      setName("");
      setCode("");
      setDesc("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department record deleted.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    createMutation.mutate({ name, code, description: desc });
  };

  const columns: ColumnDef<MockDepartment>[] = [
    {
      accessorKey: "code",
      header: "Dept Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("code")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Department Title",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">{row.getValue("name")}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.description}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={() => deleteMutation.mutate(row.original.id)}
          className="p-1 hover:bg-destructive/5 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
          title="Delete Department"
        >
          <Trash className="size-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="Departments Configuration"
        description="Configure academic and operational university department segments."
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
            label: "Create Department",
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
        title="Create Department"
        description="Add a new academic or system department workspace."
        onSubmit={handleSubmit}
        submitLabel="Create Department"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Department Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chemical Engineering"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Department Code Prefix</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CHEM"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Department of Chemical Engineering"
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}
export default DepartmentsPage;
