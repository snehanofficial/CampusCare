import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockUser } from "../../../mocks/users.js";
import { UserPlus, Edit2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button.js";
import { UserFormDialog } from "../components/UserFormDialog.js";

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    role: "",
    status: "",
  });

  // Modal Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 1. Query for User list with pagination & filters
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["users", search, filters, page],
    queryFn: () =>
      userRepository.list({
        search,
        filters,
        page,
        pageSize: 10,
      }),
  });

  // 2. Mutations for deactivation/status toggle and deletion
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return userRepository.update(id, { isActive } as any);
    },
    onSuccess: () => {
      toast.success("User status changed successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle user status.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return userRepository.delete(id);
    },
    onSuccess: () => {
      toast.success("User account deleted or deactivated successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user.");
    },
  });

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "SYSTEM_ADMIN":
      case "ADMIN":
        return "destructive";
      case "DEPT_ADMIN":
        return "warning";
      case "TECHNICIAN":
        return "warning";
      default:
        return "primary";
    }
  };

  const handleEditClick = (id: string) => {
    setSelectedUserId(id);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (user: MockUser) => {
    const isCurrentlyActive = user.status === "ACTIVE";
    toggleStatusMutation.mutate({ id: user.id, isActive: !isCurrentlyActive });
  };

  const handleDeleteClick = (user: MockUser) => {
    if (window.confirm(`Are you sure you want to delete user: ${user.firstName} ${user.lastName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const columns: ColumnDef<MockUser>[] = [
    {
      accessorKey: "email",
      header: "User Details",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.original.firstName} {row.original.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground">{row.getValue("email")}</p>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "System Role",
      cell: ({ row }) => {
        const val = row.getValue("role") as string;
        return <Tag variant={getRoleVariant(val)}>{val}</Tag>;
      },
    },
    {
      id: "tickets",
      header: "Active Tickets",
      cell: ({ row }) => {
        const u = row.original;
        const logged = u.createdTicketsCount ?? 0;
        const assigned = u.assignedTicketsCount ?? 0;
        return (
          <div className="flex gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>Logged: <strong className="text-foreground">{logged}</strong></span>
            {u.role === "TECHNICIAN" && (
              <span>• Assigned: <strong className="text-foreground">{assigned}</strong></span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Account State",
      cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return <Tag variant={val === "ACTIVE" ? "success" : "secondary"}>{val}</Tag>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered Date",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground font-semibold">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleEditClick(row.original.id)}
            className="h-7 text-[11px] font-semibold px-2.5 flex items-center gap-1"
          >
            <Edit2 className="size-3" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleToggleStatus(row.original)}
            className="h-7 text-[11px] font-semibold px-2.5 flex items-center gap-1"
          >
            <ShieldAlert className="size-3" />
            {row.original.status === "ACTIVE" ? "Disable" : "Enable"}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleDeleteClick(row.original)}
            className="h-7 text-[11px] font-semibold px-2.5 flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <EntityListTemplate
        title="User Management"
        description="Administrative control console managing system security roles and access scopes."
        columns={columns}
        data={response?.data || []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterOptions={[
          {
            key: "role",
            label: "Role Filter",
            options: [
              { value: "SYSTEM_ADMIN", label: "System Admin" },
              { value: "DEPT_ADMIN", label: "Dept Admin" },
              { value: "TECHNICIAN", label: "Technician" },
              { value: "FACULTY", label: "Faculty" },
              { value: "STUDENT", label: "Student" },
            ],
          },
          {
            key: "status",
            label: "Status Filter",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => {
          setFilters((prev) => ({ ...prev, [k]: v }));
          setPage(1);
        }}
        onClearFilters={() => {
          setSearch("");
          setPage(1);
          setFilters({ role: "", status: "" });
        }}
        actions={[
          {
            label: "Add User",
            onClick: () => {
              setSelectedUserId(null);
              setIsFormOpen(true);
            },
            icon: UserPlus,
          },
        ]}
        pageIndex={page}
        pageCount={response?.pageCount || 1}
        onPageChange={(p) => setPage(p)}
        onRetry={refetch}
      />

      <UserFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userId={selectedUserId}
        onSuccess={() => refetch()}
      />
    </>
  );
}
export default UsersPage;
