import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import {
  slaRepository,
  type MockSlaPolicy,
  type SlaComplianceReport,
} from "../../../lib/repositories/sla.repository.js";
import { Input } from "../../../components/ui/input.js";
import { Tag } from "../../../components/ui/tag.js";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Play, Gauge, ShieldAlert, Award, Hourglass, BarChart3, AlertCircle } from "lucide-react";

type PolicyForm = {
  displayName: string;
  responseTimeLimit: number;
  resolveTimeLimit: number;
  warningThreshold: number;
  color: string;
};

export function SlaPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"policies" | "compliance">("compliance");

  // ── Edit Policy State ───────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<MockSlaPolicy | null>(null);
  const [editForm, setEditForm] = useState<PolicyForm>({
    displayName: "",
    responseTimeLimit: 60,
    resolveTimeLimit: 240,
    warningThreshold: 80,
    color: "#ffffff",
  });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: policiesRes, isLoading: isPoliciesLoading, error: policiesErr, refetch: refetchPolicies } = useQuery({
    queryKey: ["sla-policies"],
    queryFn: () => slaRepository.listPolicies(),
  });

  const { data: complianceRes, isLoading: isComplianceLoading, error: complianceErr, refetch: refetchCompliance } = useQuery({
    queryKey: ["sla-compliance"],
    queryFn: () => slaRepository.getCompliance(),
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyForm }) =>
      slaRepository.updatePolicy(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
      queryClient.invalidateQueries({ queryKey: ["sla-compliance"] });
      toast.success("SLA policy updated.");
      setEditTarget(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update SLA Policy."),
  });

  const scanMutation = useMutation({
    mutationFn: () => slaRepository.checkViolations(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["sla-compliance"] });
      toast.success("SLA violations check completed.", {
        description: `Escalated ${res.escalatedCount} ticket(s) breaching deadlines.`,
      });
    },
    onError: (err: any) => toast.error(err.message || "Failed to scan violations."),
  });

  // ── Form Handlers ───────────────────────────────────────────────────────────
  const startEdit = (policy: MockSlaPolicy) => {
    setEditTarget(policy);
    setEditForm({
      displayName: policy.displayName,
      responseTimeLimit: policy.responseTimeLimit,
      resolveTimeLimit: policy.resolveTimeLimit,
      warningThreshold: policy.warningThreshold,
      color: policy.color ?? "#3B82F6",
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.displayName.trim()) { toast.error("Display name is required."); return; }
    updateMutation.mutate({ id: editTarget.id, data: editForm });
  };

  // ── Policies Columns ────────────────────────────────────────────────────────
  const columns: ColumnDef<MockSlaPolicy>[] = [
    {
      accessorKey: "priority",
      header: "Ticket Priority",
      cell: ({ row }) => {
        const val = row.getValue("priority") as string;
        const color = row.original.color ?? "#9CA3AF";
        return (
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-bold font-mono tracking-wide">{val}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "displayName",
      header: "SLA Policy Label",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.getValue("displayName")}
        </span>
      ),
    },
    {
      accessorKey: "responseTimeLimit",
      header: "Response Limit",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.getValue("responseTimeLimit")} min
        </span>
      ),
    },
    {
      accessorKey: "resolveTimeLimit",
      header: "Resolution Limit",
      cell: ({ row }) => {
        const mins = row.getValue("resolveTimeLimit") as number;
        const hours = Math.round((mins / 60) * 10) / 10;
        return (
          <span className="text-xs font-medium text-foreground">
            {mins} min ({hours} hr)
          </span>
        );
      },
    },
    {
      accessorKey: "warningThreshold",
      header: "Warning Alert",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-warning">
          {row.getValue("warningThreshold")}% Elapsed
        </span>
      ),
    },
    {
      accessorKey: "escalationRoleName",
      header: "Escalation Target",
      cell: ({ row }) => <Tag variant="secondary">{row.getValue("escalationRoleName")}</Tag>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => startEdit(row.original)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Edit policy limits"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Tab Switchers */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 cursor-pointer focus:outline-none ${
              activeTab === "compliance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <Gauge className="size-4" />
            Compliance Dashboard
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 cursor-pointer focus:outline-none ${
              activeTab === "policies"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            <BarChart3 className="size-4" />
            SLA Targets
          </button>
        </div>

        {activeTab === "compliance" && (
          <button
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary/95 cursor-pointer disabled:opacity-50"
          >
            <Play className="size-3.5" />
            Run SLA Violation Scan
          </button>
        )}
      </div>

      {activeTab === "policies" ? (
        <EntityListTemplate
          title="SLA Policies"
          description="Configure resolution and response time limits linked to ticket priorities."
          columns={columns}
          data={policiesRes?.data ?? []}
          loading={isPoliciesLoading}
          error={policiesErr ? (policiesErr as any).message : null}
          searchQuery=""
          onSearchChange={() => {}}
          activeFilters={{}}
          onFilterChange={() => {}}
          onClearFilters={() => {}}
          pageIndex={1}
          pageCount={1}
          onPageChange={() => {}}
          onRetry={refetchPolicies}
        />
      ) : (
        <div className="space-y-6">
          {isComplianceLoading ? (
            <div className="flex justify-center items-center h-48">
              <span className="text-xs text-muted-foreground animate-pulse">Loading compliance data...</span>
            </div>
          ) : complianceErr ? (
            <div className="flex justify-center items-center h-48 border border-destructive/20 bg-destructive/5 rounded p-4 text-center">
              <span className="text-xs text-destructive">{(complianceErr as any).message}</span>
            </div>
          ) : (
            <>
              {/* Compliance Header Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Compliance Rating
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {complianceRes?.complianceRate}%
                    </h3>
                  </div>
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                    <Award className="size-6" />
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Active Breach Count
                    </span>
                    <h3 className="text-2xl font-bold text-destructive mt-1">
                      {complianceRes?.activeBreaches}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-destructive/10 rounded-lg text-destructive">
                    <ShieldAlert className="size-6" />
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Average Resolution
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {complianceRes?.avgResolveTimeMin} min
                    </h3>
                  </div>
                  <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                    <Hourglass className="size-6" />
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Resolved tickets (SLA Tracked)
                    </span>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                      {complianceRes?.totalResolved}
                    </h3>
                  </div>
                  <div className="p-2.5 bg-success/10 rounded-lg text-success">
                    <CheckCircleIcon className="size-6" />
                  </div>
                </div>
              </div>

              {/* Breach Breakdown Chart Card */}
              <div className="bg-card p-5 rounded-lg border border-border space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Breaches by Ticket Priority Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(complianceRes?.breachesByPriority ?? {}).map(([priority, count]) => (
                    <div key={priority} className="p-3 bg-muted/40 border border-border rounded flex flex-col justify-between h-20">
                      <span className="text-[10px] font-bold font-mono tracking-wide">{priority}</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-bold text-foreground">{count}</span>
                        <span className="text-[10px] text-muted-foreground">breaches</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── EDIT DIALOG ───────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Update SLA Target Limits — ${editTarget?.priority}`}
        description="Modify warning triggers, resolution limits, or response targets."
        onSubmit={handleUpdateSubmit}
        submitLabel="Save Adjustments"
        isSubmitting={updateMutation.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              SLA Policy Display Name *
            </label>
            <Input
              value={editForm.displayName}
              onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="e.g. Critical Resolution Target"
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Response Target (min) *
              </label>
              <Input
                type="number"
                value={editForm.responseTimeLimit}
                onChange={(e) => setEditForm((p) => ({ ...p, responseTimeLimit: parseInt(e.target.value) || 0 }))}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Resolution Target (min) *
              </label>
              <Input
                type="number"
                value={editForm.resolveTimeLimit}
                onChange={(e) => setEditForm((p) => ({ ...p, resolveTimeLimit: parseInt(e.target.value) || 0 }))}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Warning Threshold (%) *
              </label>
              <Input
                type="number"
                value={editForm.warningThreshold}
                onChange={(e) => setEditForm((p) => ({ ...p, warningThreshold: parseInt(e.target.value) || 0 }))}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Color Tag (HEX)
              </label>
              <Input
                value={editForm.color}
                onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                placeholder="#3B82F6"
                className="text-xs h-9"
              />
            </div>
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}

// Icon helper
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

export default SlaPage;
