import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import {
  incidentRepository,
  type MockIncident,
} from "../../../lib/repositories/incident.repository.js";
import { ticketRepository } from "../../../lib/repositories/ticket.repository.js";
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
import { AlertTriangle, Eye, Pencil, Trash2, History } from "lucide-react";

const SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "primary" | "secondary"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "secondary",
};

const STATUS_CLASS: Record<string, string> = {
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-success/15 text-success",
  INVESTIGATING: "bg-primary/15 text-primary animate-pulse",
  OPEN: "bg-destructive/15 text-destructive animate-pulse",
};

type CreateForm = {
  title: string;
  description: string;
  severity: string;
  rootCause: string;
};

type UpdateForm = {
  status: string;
  severity: string;
  rootCause: string;
};

export function IncidentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── List state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    severity: "",
  });

  // ── Create dialog ───────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    title: "",
    description: "",
    severity: "HIGH",
    rootCause: "",
  });

  // ── Edit dialog ─────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<MockIncident | null>(null);
  const [editForm, setEditForm] = useState<UpdateForm>({
    status: "",
    severity: "",
    rootCause: "",
  });

  // ── Timeline state ─────────────────────────────────────────────────────────
  const [timelineTarget, setTimelineTarget] = useState<MockIncident | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["incidents", search, filters, page],
    queryFn: () =>
      incidentRepository.list({ search, filters, page, pageSize: 10 }),
  });

  const { data: timelineRes, isLoading: isTimelineLoading } = useQuery({
    queryKey: ["incident-timeline", timelineTarget?.id],
    queryFn: () => incidentRepository.getTimeline(timelineTarget!.id),
    enabled: !!timelineTarget,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      incidentRepository.create({
        title: form.title,
        description: form.description,
        severity: form.severity,
        rootCause: form.rootCause || null,
        status: "OPEN",
        ticketIds: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident declared successfully.");
      setIsCreateOpen(false);
      setForm({ title: "", description: "", severity: "HIGH", rootCause: "" });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to declare incident."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MockIncident> }) =>
      incidentRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident updated.");
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update incident."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident deleted.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete incident."),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    if (form.description.length < 10) { toast.error("Description must be at least 10 characters."); return; }
    createMutation.mutate();
  };

  const openEdit = (inc: MockIncident) => {
    setEditTarget(inc);
    setEditForm({ status: inc.status, severity: inc.severity, rootCause: inc.rootCause ?? "" });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    const payload: Partial<MockIncident> = {};
    if (editForm.status) payload.status = editForm.status;
    if (editForm.severity) payload.severity = editForm.severity;
    if (editForm.rootCause !== undefined) payload.rootCause = editForm.rootCause || null;
    updateMutation.mutate({ id: editTarget.id, data: payload });
  };

  // ── Column definitions ──────────────────────────────────────────────────────
  const columns: ColumnDef<MockIncident>[] = [
    {
      accessorKey: "id",
      header: "Incident ID",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-destructive">
          {row.original.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Outage / Event",
      cell: ({ row }) => (
        <div className="max-w-[280px] sm:max-w-xs truncate">
          <p className="text-xs font-semibold text-foreground truncate">
            {row.getValue("title")}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {row.original.description}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const val = row.getValue("severity") as string;
        return <Tag variant={SEVERITY_VARIANTS[val] ?? "secondary"}>{val}</Tag>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[s] ?? "bg-muted text-muted-foreground"}`}
          >
            {s.replace("_", " ")}
          </span>
        );
      },
    },
    {
      accessorKey: "linkedTicketCount",
      header: "Linked Tickets",
      cell: ({ row }) => (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {row.original.linkedTicketCount ?? row.original.linkedTickets?.length ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Triggered At",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => setTimelineTarget(row.original)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Incident Timeline"
          >
            <History className="size-3.5" />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            title="Edit incident"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => navigate(`/incidents/${row.original.id}`)}
            className="p-1 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary cursor-pointer focus:outline-none"
            title="View incident details"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            onClick={() => void (confirm("Delete this incident record?") && deleteMutation.mutate(row.original.id))}
            className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive cursor-pointer focus:outline-none"
            title="Delete incident"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* ── List ────────────────────────────────────────────────────────── */}
      <EntityListTemplate
        title="Critical Incidents"
        description="Active core outages and critical infrastructure breakdowns."
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
              { value: "INVESTIGATING", label: "Investigating" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ],
          },
          {
            key: "severity",
            label: "Severity",
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
        onClearFilters={() => { setSearch(""); setFilters({ status: "", severity: "" }); setPage(1); }}
        actions={[
          {
            label: "Declare Incident",
            onClick: () => setIsCreateOpen(true),
            icon: AlertTriangle,
            variant: "destructive",
          },
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
        title="Declare New Incident"
        description="Log a critical infrastructure outage and assign its severity level."
        onSubmit={handleCreate}
        submitLabel="Declare Incident"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Incident Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Core network switch down – Block A"
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
              placeholder="Describe the impact and affected systems..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Severity *
            </label>
            <Select
              value={form.severity}
              onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}
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
              Root Cause (optional)
            </label>
            <Input
              value={form.rootCause}
              onChange={(e) => setForm((p) => ({ ...p, rootCause: e.target.value }))}
              placeholder="e.g. Faulty SFP module on Core-SW-01"
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ── Edit dialog ──────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Update Incident — ${editTarget?.title ?? ""}`}
        description="Update the status, severity, or root cause of this incident."
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
                <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Severity
            </label>
            <Select
              value={editForm.severity}
              onValueChange={(v) => setEditForm((p) => ({ ...p, severity: v }))}
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
              Root Cause
            </label>
            <Input
              value={editForm.rootCause}
              onChange={(e) => setEditForm((p) => ({ ...p, rootCause: e.target.value }))}
              placeholder="Identified root cause..."
              className="text-xs"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
      {/* ── Timeline dialog ─────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!timelineTarget}
        onClose={() => setTimelineTarget(null)}
        title={`Incident Audit Timeline`}
        description={`Audit trail and action logs for incident: "${timelineTarget?.title ?? ""}"`}
        onSubmit={(e) => { e.preventDefault(); setTimelineTarget(null); }}
        submitLabel="Close"
        isSubmitting={false}
      >
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {isTimelineLoading ? (
            <div className="text-center py-6 text-xs text-muted-foreground animate-pulse">
              Loading timeline events...
            </div>
          ) : !timelineRes || timelineRes.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No audit logs recorded for this incident.
            </div>
          ) : (
            <div className="relative pl-4 border-l border-border space-y-4 text-xs">
              {timelineRes.map((log: any, idx: number) => (
                <div key={log.id || idx} className="relative">
                  <span className="absolute -left-[21px] mt-1 size-2 rounded-full bg-primary border-2 border-background" />
                  <p className="font-semibold text-foreground">
                    {log.action.replace("_", " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    by {log.performedByName} on {new Date(log.createdAt).toLocaleString()}
                  </p>
                  {log.newValue && (
                    <pre className="mt-1 p-1 bg-muted rounded text-[9px] font-mono overflow-x-auto text-muted-foreground max-w-full white-space-pre-wrap">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CRUDDialogTemplate>
    </>
  );
}

export default IncidentsPage;
