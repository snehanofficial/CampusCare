import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockUser } from "../../../mocks/users.js";
import { Users, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    role: "",
    status: "",
  });

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["users", search, filters],
    queryFn: () =>
      userRepository.list({
        search,
        filters,
      }),
  });

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "TECHNICIAN":
        return "warning";
      default:
        return "primary";
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
  ];

  return (
    <EntityListTemplate
      title="User Management"
      description="Administrative control console managing system security roles and access scopes."
      columns={columns}
      data={response?.data || []}
      loading={isLoading}
      error={error ? error.message : null}
      searchQuery={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "role",
          label: "Role Filter",
          options: [
            { value: "ADMIN", label: "Admin" },
            { value: "TECHNICIAN", label: "Technician" },
            { value: "STUDENT", label: "Student" },
            { value: "FACULTY", label: "Faculty" },
          ],
        },
      ]}
      activeFilters={filters}
      onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
      onClearFilters={() => {
        setSearch("");
        setFilters({ role: "", status: "" });
      }}
      actions={[
        {
          label: "Invite User",
          onClick: () => toast.info("Federated identity invites requires Azure AD sync integration."),
          icon: UserPlus,
        },
      ]}
      pageIndex={response?.page || 1}
      pageCount={response?.pageCount || 1}
      onPageChange={() => {}}
      onRetry={refetch}
    />
  );
}
export default UsersPage;
