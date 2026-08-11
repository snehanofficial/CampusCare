import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { EntityListTemplate } from "@/components/templates/EntityListTemplate.js";
import { Tag } from "@/components/ui/tag.js";
import { userRepository } from "@/lib/repositories/user.repository.js";
import { departmentRepository } from "@/lib/repositories/department.repository.js";
import { useTechnicianAvailability, useTechnicianWorkload, useCountdown } from "../hooks/index.js";
import { resolveAvailabilityState, formatRemaining } from "../utils/index.js";

interface TechnicianRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string | null;
  departmentName: string;
  isActive: boolean;
}

export function TechniciansPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ department: "", availability: "" });
  const now = useCountdown(true);

  // Authoritative roster: every TECHNICIAN account, active or not — this page
  // is a management view, so unlike the auto-assignment engine's "eligible"
  // list it must show everyone, including technicians who are currently
  // excluded from assignment.
  const {
    data: usersResponse,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users", "technicians-roster"],
    queryFn: () => userRepository.list({ filters: { role: "TECHNICIAN" }, pageSize: 200 }),
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentRepository.list({ pageSize: 200 }),
  });

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of departments?.data ?? []) map.set(d.id, d.name);
    return map;
  }, [departments]);

  const roster: TechnicianRow[] = useMemo(
    () =>
      (usersResponse?.data ?? []).map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        departmentId: u.departmentId ?? null,
        departmentName: u.departmentId ? departmentNameById.get(u.departmentId) ?? "—" : "—",
        isActive: u.status ? u.status === "ACTIVE" : (u.isActive ?? true),
      })),
    [usersResponse, departmentNameById],
  );

  const technicianIds = useMemo(() => roster.map((r) => r.id), [roster]);

  // Authoritative availability + live workload — both come straight from the
  // backend (TECH-001); nothing here is computed on the frontend.
  const { data: availabilityRows, isLoading: availabilityLoading, error: availabilityError, refetch: refetchAvailability } =
    useTechnicianAvailability(undefined, technicianIds.length > 0);
  const { data: workloadMap, isLoading: workloadLoading } = useTechnicianWorkload(technicianIds, technicianIds.length > 0);

  const availabilityByTechId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof availabilityRows>[number]>();
    for (const row of availabilityRows ?? []) map.set(row.technicianId, row);
    return map;
  }, [availabilityRows]);

  const enriched = useMemo(() => {
    return roster.map((r) => {
      const availability = availabilityByTechId.get(r.id) ?? null;
      const state = resolveAvailabilityState({
        isActive: r.isActive,
        isManuallyUnavailable: availability?.isManuallyUnavailable ?? false,
        unavailableUntil: availability?.unavailableUntil ?? null,
        now,
      });
      return {
        ...r,
        workload: workloadMap?.[r.id] ?? 0,
        state,
        unavailableUntil: availability?.unavailableUntil ?? null,
        reason: availability?.reason ?? null,
      };
    });
  }, [roster, availabilityByTechId, workloadMap, now]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q),
      );
    }
    if (filters.department) list = list.filter((t) => t.departmentId === filters.department);
    if (filters.availability) list = list.filter((t) => t.state === filters.availability);
    return list.slice().sort((a, b) => a.workload - b.workload);
  }, [enriched, search, filters]);

  const columns: ColumnDef<(typeof enriched)[number]>[] = [
    {
      id: "name",
      header: "Technician",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-bold text-foreground">
            {row.original.firstName} {row.original.lastName}
          </p>
          <p className="text-[10px] text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-xs text-foreground">{row.original.departmentName}</span>,
    },
    {
      id: "availability",
      header: "Availability",
      cell: ({ row }) => {
        const t = row.original;
        if (t.state === "INACTIVE") return <Tag variant="secondary">Inactive</Tag>;
        if (t.state === "TEMPORARILY_UNAVAILABLE") {
          return (
            <div className="space-y-0.5">
              <Tag variant="warning">Temporarily Unavailable</Tag>
              <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                Until {formatRemaining(t.unavailableUntil, now)}
              </p>
            </div>
          );
        }
        return <Tag variant="success">Available</Tag>;
      },
    },
    {
      id: "workload",
      header: "Active Workload",
      cell: ({ row }) => (
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {row.original.workload} open ticket{row.original.workload === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link
          to={`/technicians/${row.original.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-ring rounded-xs"
        >
          View details
          <ChevronRight className="size-3" />
        </Link>
      ),
    },
  ];

  const loading = usersLoading || availabilityLoading || workloadLoading;
  const error = usersError || availabilityError;

  return (
    <EntityListTemplate
      title="Technician Management"
      description="Availability, workload, and assignment eligibility for IT support technicians."
      columns={columns}
      data={filtered}
      loading={loading}
      error={error ? (error as Error).message : null}
      searchPlaceholder="Search technicians by name or email…"
      searchQuery={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "department",
          label: "Department",
          options: (departments?.data ?? []).map((d) => ({ value: d.id, label: d.name })),
        },
        {
          key: "availability",
          label: "Availability",
          options: [
            { value: "AVAILABLE", label: "Available" },
            { value: "TEMPORARILY_UNAVAILABLE", label: "Temporarily Unavailable" },
            { value: "INACTIVE", label: "Inactive" },
          ],
        },
      ]}
      activeFilters={filters}
      onFilterChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
      onClearFilters={() => {
        setSearch("");
        setFilters({ department: "", availability: "" });
      }}
      actions={[]}
      onRetry={() => {
        void refetchUsers();
        void refetchAvailability();
      }}
    />
  );
}
export default TechniciansPage;
