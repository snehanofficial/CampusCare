import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { ticketRepository } from "../../../lib/repositories/ticket.repository.js";
import { departmentRepository } from "../../../lib/repositories/department.repository.js";
import { categoryRepository } from "../../../lib/repositories/category.repository.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../components/ui/select.js";
import { Tag } from "../../../components/ui/tag.js";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockTicket } from "../../../mocks/tickets.js";
import { Plus, Eye, Trash2, Pencil, GitMerge, Check, RotateCcw, FileDown } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth.js";

const PRIORITY_VARIANTS: Record<string, "destructive" | "warning" | "primary" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "secondary",
};

const STATUS_CLASS: Record<string, string> = {
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-success/15 text-success",
  IN_PROGRESS: "bg-primary/15 text-primary",
  ASSIGNED: "bg-blue-500/15 text-blue-500",
  PENDING: "bg-orange-500/15 text-orange-500",
  OPEN: "bg-warning/15 text-warning",
};

type CreateForm = {
  title: string;
  description: string;
  priority: string;
  categoryId: string;
  departmentId: string;
};

type UpdateForm = {
  status: string;
  priority: string;
  assigneeId: string;
};

export function TicketsPage({ mineOnly = false }: { mineOnly?: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const role = currentUser?.role ?? "STUDENT";
  // Role-based capability flags
  const isAdmin = role === "SYSTEM_ADMIN";
  const isDeptAdmin = role === "DEPT_ADMIN";
  const isTechnician = role === "TECHNICIAN";
  const isStudent = role === "STUDENT" || role === "FACULTY";
  const canEditTickets = isAdmin || isDeptAdmin;       // Only admins can edit ticket metadata
  const canDeleteTickets = isAdmin;                    // Only system admin can delete
  const canMergeTickets = isAdmin || isDeptAdmin;      // Only admins can merge
  const canAssign = isAdmin || isDeptAdmin;            // Only admins can assign
  const isRequesterRole = isStudent;                   // Students/Faculty are requesters

  // ── List state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    priority: "",
    isIncident: "false",
  });

  // ── Create dialog ───────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    title: "",
    description: "",
    priority: "MEDIUM",
    categoryId: "",
    departmentId: "",
  });

  // ── Edit dialog ─────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<MockTicket | null>(null);
  const [editForm, setEditForm] = useState<UpdateForm>({
    status: "",
    priority: "",
    assigneeId: "",
  });

  // ── Merge dialog state ──────────────────────────────────────────────────────
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState("");
  const [mergeSecondaryIds, setMergeSecondaryIds] = useState<string[]>([]);

  // ── Reopen dialog state ─────────────────────────────────────────────────────
  const [reopenTarget, setReopenTarget] = useState<MockTicket | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  // ── Sorting state ────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ── Queries ─────────────────────────────────────────────────────────────────
  const queryKey = mineOnly
    ? ["tickets", "mine", search, filters, page, sortBy, sortOrder]
    : ["tickets", "all", search, filters, page, sortBy, sortOrder];

  // For technicians, "My Tickets" means tickets assigned to them (not created by them)
  // For students/faculty, "My Tickets" is handled server-side by the backend (creatorId enforcement)
  const technicianAssigneeFilter = mineOnly && isTechnician && currentUser?.id
    ? { assigneeId: currentUser.id }
    : {};

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      ticketRepository.list({
        search,
        filters: {
          ...filters,
          ...(mineOnly && !isTechnician ? { isIncident: "false" } : {}),
          ...technicianAssigneeFilter,
        },
        page,
        pageSize: 10,
        sortBy,
        sortOrder,
      }),
  });

  const { data: catResponse } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => categoryRepository.list({ pageSize: 100 }),
    staleTime: 60_000,
  });

  const { data: deptResponse } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentRepository.list({ pageSize: 100 }),
    staleTime: 60_000,
  });

  const { data: techResponse } = useQuery({
    queryKey: ["users", "technicians"],
    queryFn: () => userRepository.list({ filters: { role: "TECHNICIAN" }, pageSize: 100 }),
    staleTime: 60_000,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      ticketRepository.create({
        title: form.title,
        description: form.description,
        priority: form.priority as MockTicket["priority"],
        categoryId: form.categoryId,
        departmentId: form.departmentId,
        isIncident: false,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Support ticket logged successfully!");
      setIsCreateOpen(false);
      setForm({ title: "", description: "", priority: "MEDIUM", categoryId: "", departmentId: "" });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create ticket."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MockTicket> }) =>
      ticketRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated successfully.");
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update ticket."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete ticket."),
  });

  const mergeMutation = useMutation({
    mutationFn: () => ticketRepository.mergeTickets(mergePrimaryId, mergeSecondaryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Tickets merged successfully.");
      setIsMergeOpen(false);
      setMergePrimaryId("");
      setMergeSecondaryIds([]);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to merge tickets."),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => ticketRepository.verifyTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Resolution verified. Ticket permanently closed.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to verify resolution."),
  });

  const reopenMutation = useMutation({
    mutationFn: () => ticketRepository.reopenTicket(reopenTarget!.id, reopenReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket reopened successfully.");
      setReopenTarget(null);
      setReopenReason("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to reopen ticket."),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (!form.categoryId) { toast.error("Please select a category."); return; }
    if (!form.departmentId) { toast.error("Please select a department."); return; }
    createMutation.mutate();
  };

  const openEdit = (ticket: MockTicket) => {
    setEditTarget(ticket);
    setEditForm({ status: ticket.status, priority: ticket.priority, assigneeId: ticket.assigneeId ?? "" });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const payload: any = {};
    if (editForm.status) payload.status = editForm.status;
    if (editForm.priority) payload.priority = editForm.priority;
    payload.assigneeId = editForm.assigneeId === "UNASSIGNED" || !editForm.assigneeId ? null : editForm.assigneeId;
    updateMutation.mutate({ id: editTarget.id, data: payload });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortableHeader = (label: string, field: string) => {
    const isSorted = sortBy === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-foreground cursor-pointer font-bold focus:outline-none select-none text-[11px]"
      >
        <span>{label}</span>
        {isSorted ? (
          sortOrder === "asc" ? " ▲" : " ▼"
        ) : (
          <span className="opacity-30 text-[9px]"> ↕</span>
        )}
      </button>
    );
  };

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<MockTicket>[] = [
    {
      accessorKey: "ticketNumber",
      header: () => renderSortableHeader("Ticket ID", "ticketNumber"),
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.getValue("ticketNumber")}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: () => renderSortableHeader("Title", "title"),
      cell: ({ row }) => (
        <div className="max-w-[280px] sm:max-w-xs truncate">
          <div className="flex items-center gap-1.5 truncate">
            <p className="text-xs font-semibold text-foreground truncate">{row.getValue("title")}</p>
            {row.original.reopenCount && row.original.reopenCount > 0 ? (
              <span className="inline-flex px-1 py-0.2 bg-destructive/15 text-destructive rounded text-[9px] font-bold">
                Reopened {row.original.reopenCount}x
              </span>
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: () => renderSortableHeader("Priority", "priority"),
      cell: ({ row }) => {
        const val = row.getValue("priority") as string;
        return <Tag variant={PRIORITY_VARIANTS[val] ?? "secondary"}>{val}</Tag>;
      },
    },
    {
      accessorKey: "status",
      header: () => renderSortableHeader("Status", "status"),
      cell: ({ row }) => {
        const s = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold select-none ${STATUS_CLASS[s] ?? "bg-muted text-muted-foreground"}`}
          >
            {s.replace("_", " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => renderSortableHeader("Created", "createdAt"),
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "dueAt",
      header: () => renderSortableHeader("SLA Timer", "dueAt"),
      cell: ({ row }) => {
        const dueAt = row.original.dueAt;
        const status = row.original.status;

        if (status === "CLOSED" || status === "RESOLVED") {
          return <span className="text-[11px] text-success font-semibold">Met</span>;
        }

        if (!dueAt) {
          return <span className="text-[11px] text-muted-foreground">—</span>;
        }

        const deadline = new Date(dueAt).getTime();
        const now = Date.now();
        const diffMs = deadline - now;

        if (diffMs < 0) {
          return (
            <span className="inline-flex items-center gap-1 rounded bg-destructive/15 text-destructive text-[10px] font-bold px-1.5 py-0.5">
              Breached
            </span>
          );
        }

        const diffMins = Math.floor(diffMs / (1000 * 60));
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;

        const timeString = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        const isUrgent = diffMins < 60; // Less than 1 hour left

        return (
          <span
            className={`inline-flex items-center gap-1 rounded text-[10px] font-bold px-1.5 py-0.5 ${
              isUrgent ? "bg-warning/15 text-warning animate-pulse" : "bg-primary/15 text-primary"
            }`}
          >
            {timeString} left
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isResolved = row.original.status === "RESOLVED";
        // Is the logged-in user the ticket creator?
        const isOwner = row.original.creatorId === currentUser?.id;
        return (
          <div className="flex justify-end gap-1.5">
            {/* Verify & Reopen: only for the ticket creator (student/faculty) on resolved tickets */}
            {isResolved && isRequesterRole && isOwner && (
              <>
                <button
                  onClick={() => verifyMutation.mutate(row.original.id)}
                  disabled={verifyMutation.isPending}
                  className="p-1 hover:bg-success/15 rounded text-success cursor-pointer focus:outline-none disabled:opacity-50"
                  title="Verify & Close"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  onClick={() => setReopenTarget(row.original)}
                  className="p-1 hover:bg-destructive/15 rounded text-destructive cursor-pointer focus:outline-none"
                  title="Reopen Ticket"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </>
            )}
            {/* Admin Verify & Reopen: available to admins on any resolved ticket */}
            {isResolved && !isRequesterRole && !isTechnician && (
              <>
                <button
                  onClick={() => verifyMutation.mutate(row.original.id)}
                  disabled={verifyMutation.isPending}
                  className="p-1 hover:bg-success/15 rounded text-success cursor-pointer focus:outline-none disabled:opacity-50"
                  title="Verify & Close"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  onClick={() => setReopenTarget(row.original)}
                  className="p-1 hover:bg-destructive/15 rounded text-destructive cursor-pointer focus:outline-none"
                  title="Reopen Ticket"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </>
            )}
            {/* Edit: only for admins — NOT for students, faculty, or technicians */}
            {canEditTickets && !isResolved && (
              <button
                onClick={() => openEdit(row.original)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                title="Edit ticket"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {/* View Details: always visible */}
            <button
              onClick={() => navigate(`/tickets/${row.original.id}`)}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
              title="View details"
            >
              <Eye className="size-3.5" />
            </button>
            {/* Delete: only for System Admin */}
            {canDeleteTickets && (
              <button
                onClick={() => void (confirm(`Delete ticket ${row.original.ticketNumber}?`) && deleteMutation.mutate(row.original.id))}
                className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
                title="Delete ticket"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const categories = catResponse?.data ?? [];
  const departments = deptResponse?.data ?? [];

  return (
    <>
      {/* ── List ────────────────────────────────────────────────────────── */}
      <EntityListTemplate
        title={mineOnly ? "My Tickets" : "Ticket Dispatch"}
        description={
          mineOnly
            ? "Log and track your personal IT support requests."
            : "Global queue of all registered IT support tickets."
        }
        columns={columns}
        data={response?.data ?? []}
        loading={isLoading}
        error={error ? error.message : null}
        searchQuery={search}
        onSearchChange={(q) => { setSearch(q); setPage(1); }}
        filterOptions={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "OPEN", label: "Open" },
              { value: "ASSIGNED", label: "Assigned" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "PENDING", label: "Pending" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ],
          },
          {
            key: "priority",
            label: "Priority",
            options: [
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
              { value: "CRITICAL", label: "Critical" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(k, v) => { setFilters((prev) => ({ ...prev, [k]: v })); setPage(1); }}
        onClearFilters={() => { setSearch(""); setFilters({ status: "", priority: "", isIncident: "false" }); setPage(1); }}
        actions={[
          { label: "Create Ticket", onClick: () => setIsCreateOpen(true), icon: Plus },
          // Merge: only for admins
          ...(canMergeTickets ? [{ label: "Merge Tickets", onClick: () => setIsMergeOpen(true), icon: GitMerge, variant: "secondary" as const }] : []),
          // Bulk Actions + Export: only for admins
          ...(isAdmin ? [
            { label: "Bulk Actions", onClick: () => toast.info("Select rows to perform bulk operations."), icon: Check, variant: "outline" as const },
            { label: "Export", onClick: () => toast.success("Queue list exported successfully!"), icon: FileDown, variant: "outline" as const },
          ] : []),
        ]}
        pageIndex={page}
        pageCount={response?.pageCount ?? 1}
        onPageChange={setPage}
        onRetry={refetch}
      />

      {/* ── Create dialog ────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Support Ticket"
        description="Describe the issue, set priority, and select the relevant category and department."
        onSubmit={handleCreate}
        submitLabel="Log Ticket"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Printer in Room 102 offline"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Description *
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Category *
              </label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
              >
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Department *
              </label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((p) => ({ ...p, departmentId: v }))}
              >
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Priority *
            </label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}
            >
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ── Edit dialog ──────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Update Ticket — ${editTarget?.ticketNumber ?? ""}`}
        description="Update the status, priority, or assignment of this ticket."
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
        isSubmitting={updateMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Status
            </label>
            <Select
              value={editForm.status}
              onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Priority
            </label>
            <Select
              value={editForm.priority}
              onValueChange={(v) => setEditForm((p) => ({ ...p, priority: v }))}
            >
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Assignee
            </label>
            <Select
              value={editForm.assigneeId || "UNASSIGNED"}
              onValueChange={(v) => setEditForm((p) => ({ ...p, assigneeId: v }))}
            >
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                {(techResponse?.data ?? []).map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ── Merge dialog ────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        title="Merge Support Tickets"
        description="Select a primary active ticket, and choose one or more secondary tickets to merge and close."
        onSubmit={(e) => {
          e.preventDefault();
          if (!mergePrimaryId) { toast.error("Primary ticket is required."); return; }
          if (mergeSecondaryIds.length === 0) { toast.error("Select at least one secondary ticket to merge."); return; }
          mergeMutation.mutate();
        }}
        submitLabel="Merge & Close Secondary"
        isSubmitting={mergeMutation.isPending}

      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Primary Ticket (Will remain Active) *
            </label>
            <Select
              value={mergePrimaryId}
              onValueChange={(v) => {
                setMergePrimaryId(v);
                setMergeSecondaryIds(prev => prev.filter(id => id !== v));
              }}
            >
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select primary ticket" />
              </SelectTrigger>
              <SelectContent>
                {(response?.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.ticketNumber}: {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Select Secondary Ticket(s) to Close *
            </label>
            <div className="space-y-2 border border-border p-3 rounded bg-card max-h-[180px] overflow-y-auto">
              {(response?.data ?? [])
                .filter((t) => t.id !== mergePrimaryId)
                .map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      id={`chk-${t.id}`}
                      checked={mergeSecondaryIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMergeSecondaryIds((prev) => [...prev, t.id]);
                        } else {
                          setMergeSecondaryIds((prev) => prev.filter((id) => id !== t.id));
                        }
                      }}
                      className="size-4 rounded accent-primary cursor-pointer"
                    />
                    <label htmlFor={`chk-${t.id}`} className="flex-1 cursor-pointer font-medium truncate">
                      <span className="font-mono font-bold text-primary mr-1.5">{t.ticketNumber}</span>
                      {t.title}
                    </label>
                  </div>
                ))}
              {(response?.data ?? []).filter((t) => t.id !== mergePrimaryId).length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4">
                  No other tickets available to merge.
                </p>
              )}
            </div>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ── Reopen dialog ────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!reopenTarget}
        onClose={() => setReopenTarget(null)}
        title={`Reopen Ticket: ${reopenTarget?.ticketNumber}`}
        description="Explain why the resolution was not satisfactory. The ticket will be reassigned."
        onSubmit={(e) => {
          e.preventDefault();
          if (reopenReason.trim().length < 5) {
            toast.error("Reopen reason must be at least 5 characters.");
            return;
          }
          reopenMutation.mutate();
        }}
        submitLabel="Reopen Ticket"
        isSubmitting={reopenMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Reason for Reopening *
            </label>
            <Textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Provide details about what remains unfixed..."
              rows={4}
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}

export default TicketsPage;
