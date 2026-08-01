import React, { useState } from "react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import {
  automationRepository,
  type MockAutomationRule,
  type MockAutomationLog,
} from "../../../lib/repositories/automation.repository.js";
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
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Pencil, Play, ShieldAlert, History, Settings, Check, X, FileText } from "lucide-react";

// Types for condition & action builders
type ConditionItem = {
  field: "priority" | "status" | "categoryId" | "departmentId" | "assigneeId" | "creatorId";
  operator: "eq" | "neq" | "in" | "not_in" | "is_null" | "is_not_null";
  value: string;
};

type ActionItem = {
  type: "ASSIGN_TO" | "SET_PRIORITY" | "SET_STATUS" | "ADD_COMMENT" | "SET_DEPARTMENT";
  value: string;
};

type CreateRuleForm = {
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  trigger: "ON_CREATE" | "ON_UPDATE" | "ON_STATUS_CHANGE";
  conditions: ConditionItem[];
  actions: ActionItem[];
};

export function AutomationPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"rules" | "logs">("rules");

  // ── Search & pagination states ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [rulesPage, setRulesPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  // ── Create rule state ────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateRuleForm>({
    name: "",
    description: "",
    isActive: true,
    priority: 10,
    trigger: "ON_CREATE",
    conditions: [{ field: "priority", operator: "eq", value: "HIGH" }],
    actions: [{ type: "SET_PRIORITY", value: "CRITICAL" }],
  });

  // ── Edit rule state ──────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<MockAutomationRule | null>(null);
  const [editForm, setEditForm] = useState<CreateRuleForm>({
    name: "",
    description: "",
    isActive: true,
    priority: 10,
    trigger: "ON_CREATE",
    conditions: [],
    actions: [],
  });

  // ── Lookup data queries ──────────────────────────────────────────────────────
  const { data: deptRes } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list({ pageSize: 100 }),
    staleTime: 60_000,
  });

  const { data: catRes } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryRepository.list({ pageSize: 100 }),
    staleTime: 60_000,
  });

  const { data: userRes } = useQuery({
    queryKey: ["users"],
    queryFn: () => userRepository.list({ pageSize: 100 }),
    staleTime: 60_000,
  });

  // ── Rules & Logs main queries ───────────────────────────────────────────────
  const { data: rulesRes, isLoading: isRulesLoading, error: rulesErr, refetch: refetchRules } = useQuery({
    queryKey: ["automation-rules", search, rulesPage],
    queryFn: () => automationRepository.listRules({ search, page: rulesPage, pageSize: 10 }),
    enabled: activeTab === "rules",
  });

  const { data: logsRes, isLoading: isLogsLoading, error: logsErr, refetch: refetchLogs } = useQuery({
    queryKey: ["automation-logs", logsPage],
    queryFn: () => automationRepository.listLogs({ page: logsPage, pageSize: 15 }),
    enabled: activeTab === "logs",
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: CreateRuleForm) => automationRepository.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Automation rule created.");
      setIsCreateOpen(false);
      setForm({
        name: "",
        description: "",
        isActive: true,
        priority: 10,
        trigger: "ON_CREATE",
        conditions: [{ field: "priority", operator: "eq", value: "HIGH" }],
        actions: [{ type: "SET_PRIORITY", value: "CRITICAL" }],
      });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create rule."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRuleForm }) =>
      automationRepository.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Rule updated successfully.");
      setEditTarget(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update rule."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => automationRepository.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      toast.success("Rule deleted.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete rule."),
  });

  // ── Dynamic handlers ────────────────────────────────────────────────────────
  const handleAddCondition = (isEdit: boolean) => {
    const defaultCond: ConditionItem = { field: "priority", operator: "eq", value: "HIGH" };
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, conditions: [...prev.conditions, defaultCond] }));
    } else {
      setForm((prev) => ({ ...prev, conditions: [...prev.conditions, defaultCond] }));
    }
  };

  const handleRemoveCondition = (isEdit: boolean, idx: number) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
    } else {
      setForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
    }
  };

  const handleUpdateCondition = (isEdit: boolean, idx: number, key: keyof ConditionItem, value: string) => {
    const updater = (prev: CreateRuleForm) => {
      const copy = [...prev.conditions];
      const target = { ...copy[idx]! };
      (target as any)[key] = value;
      copy[idx] = target;
      return { ...prev, conditions: copy };
    };
    if (isEdit) setEditForm(updater);
    else setForm(updater);
  };

  const handleAddAction = (isEdit: boolean) => {
    const defaultAct: ActionItem = { type: "SET_PRIORITY", value: "CRITICAL" };
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, actions: [...prev.actions, defaultAct] }));
    } else {
      setForm((prev) => ({ ...prev, actions: [...prev.actions, defaultAct] }));
    }
  };

  const handleRemoveAction = (isEdit: boolean, idx: number) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, actions: prev.actions.filter((_, i) => i !== idx) }));
    } else {
      setForm((prev) => ({ ...prev, actions: prev.actions.filter((_, i) => i !== idx) }));
    }
  };

  const handleUpdateAction = (isEdit: boolean, idx: number, key: keyof ActionItem, value: string) => {
    const updater = (prev: CreateRuleForm) => {
      const copy = [...prev.actions];
      const target = { ...copy[idx]! };
      (target as any)[key] = value;
      copy[idx] = target;
      return { ...prev, actions: copy };
    };
    if (isEdit) setEditForm(updater);
    else setForm(updater);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Rule name is required."); return; }
    if (form.conditions.length === 0) { toast.error("At least one condition is required."); return; }
    if (form.actions.length === 0) { toast.error("At least one action is required."); return; }
    createMutation.mutate(form);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.name.trim()) { toast.error("Rule name is required."); return; }
    if (editForm.conditions.length === 0) { toast.error("At least one condition is required."); return; }
    if (editForm.actions.length === 0) { toast.error("At least one action is required."); return; }
    updateMutation.mutate({ id: editTarget.id, data: editForm });
  };

  const startEdit = (rule: MockAutomationRule) => {
    setEditTarget(rule);
    setEditForm({
      name: rule.name,
      description: rule.description ?? "",
      isActive: rule.isActive,
      priority: rule.priority,
      trigger: rule.trigger,
      conditions: rule.conditions.map((c) => ({
        field: c.field as any,
        operator: c.operator as any,
        value: String(c.value ?? ""),
      })),
      actions: rule.actions.map((a) => ({
        type: a.type as any,
        value: String(a.value ?? ""),
      })),
    });
  };

  // ── Condition field/value helpers ──────────────────────────────────────────
  const depts = deptRes?.data ?? [];
  const cats = catRes?.data ?? [];
  const users = userRes?.data ?? [];

  const renderValueInput = (isEdit: boolean, idx: number, fieldName: string) => {
    const list = isEdit ? editForm.conditions : form.conditions;
    const item = list[idx]!;
    if (fieldName === "priority") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateCondition(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (fieldName === "status") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateCondition(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
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
      );
    }
    if (fieldName === "categoryId") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateCondition(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {cats.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (fieldName === "departmentId") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateCondition(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            {depts.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        value={item.value}
        onChange={(e) => handleUpdateCondition(isEdit, idx, "value", e.target.value)}
        placeholder="Value (UUID, Text, etc)"
        className="text-xs h-8"
      />
    );
  };

  const renderActionValueInput = (isEdit: boolean, idx: number, typeName: string) => {
    const list = isEdit ? editForm.actions : form.actions;
    const item = list[idx]!;
    if (typeName === "SET_PRIORITY") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateAction(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (typeName === "SET_STATUS") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateAction(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
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
      );
    }
    if (typeName === "ASSIGN_TO") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateAction(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue placeholder="Select Assignee" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (typeName === "SET_DEPARTMENT") {
      return (
        <Select
          value={item.value}
          onValueChange={(v) => handleUpdateAction(isEdit, idx, "value", v)}
        >
          <SelectTrigger className="text-xs h-8 bg-card">
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            {depts.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        value={item.value}
        onChange={(e) => handleUpdateAction(isEdit, idx, "value", e.target.value)}
        placeholder="Action Value (e.g. comment text)"
        className="text-xs h-8"
      />
    );
  };

  // ── Column Definitions ──────────────────────────────────────────────────────
  const rulesColumns: ColumnDef<MockAutomationRule>[] = [
    {
      accessorKey: "name",
      header: "Rule Name",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="text-xs font-semibold text-foreground">{row.getValue("name")}</p>
          {row.original.description && (
            <p className="text-[10px] text-muted-foreground truncate">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "trigger",
      header: "Trigger Event",
      cell: ({ row }) => <Tag variant="primary">{row.getValue("trigger")}</Tag>,
    },
    {
      accessorKey: "priority",
      header: "Execution Order",
      cell: ({ row }) => (
        <span className="text-[11px] font-mono font-bold">
          Priority: {row.getValue("priority")}
        </span>
      ),
    },
    {
      accessorKey: "executionCount",
      header: "Runs",
      cell: ({ row }) => (
        <span className="text-[11px] font-bold text-muted-foreground">
          {row.getValue("executionCount")}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("isActive") as boolean;
        return (
          <Tag variant={active ? "success" : "secondary"}>
            {active ? "Active" : "Inactive"}
          </Tag>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => startEdit(row.original)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
            title="Edit rule"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={() => void (confirm("Are you sure you want to delete this rule?") && deleteMutation.mutate(row.original.id))}
            className="p-1 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive cursor-pointer"
            title="Delete rule"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const logsColumns: ColumnDef<MockAutomationLog>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-[10px] text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "ruleName",
      header: "Rule Fired",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground">
          {row.getValue("ruleName") || `Rule #${row.original.ruleId.slice(0, 8)}`}
        </span>
      ),
    },
    {
      accessorKey: "ticketId",
      header: "Target Ticket",
      cell: ({ row }) => (
        <span className="font-mono text-[10px] text-primary">
          {String(row.getValue("ticketId") ?? "").slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "triggered",
      header: "Result",
      cell: ({ row }) => {
        const match = row.getValue("triggered") as boolean;
        return (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
              match ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            {match ? <Check className="size-3" /> : <X className="size-3" />}
            {match ? "Triggered" : "Ignored"}
          </span>
        );
      },
    },
    {
      accessorKey: "actionsRun",
      header: "Actions Taken",
      cell: ({ row }) => {
        const actions = row.getValue("actionsRun") as string[];
        if (!actions || actions.length === 0) {
          return <span className="text-[10px] text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {actions.map((act, i) => (
              <span key={i} className="text-[9px] font-mono bg-card px-1 py-0.2 rounded border border-border">
                {act}
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 cursor-pointer focus:outline-none ${
              activeTab === "rules" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <Settings className="size-4" />
            Rules Config
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 cursor-pointer focus:outline-none ${
              activeTab === "logs" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            }`}
          >
            <History className="size-4" />
            Automation logs
          </button>
        </div>
      </div>

      {activeTab === "rules" ? (
        <EntityListTemplate
          title="Workflow Rules"
          description="Build condition-action automation trigger paths for ticket lifecycle events."
          columns={rulesColumns}
          data={rulesRes?.data ?? []}
          loading={isRulesLoading}
          error={rulesErr ? (rulesErr as any).message : null}
          searchQuery={search}
          onSearchChange={setSearch}
          activeFilters={{}}
          onFilterChange={() => {}}
          onClearFilters={() => setSearch("")}
          actions={[{ label: "Add Rule", onClick: () => setIsCreateOpen(true), icon: Plus }]}
          pageIndex={rulesPage}
          pageCount={rulesRes?.pageCount ?? 1}
          onPageChange={setRulesPage}
          onRetry={refetchRules}
        />
      ) : (
        <EntityListTemplate
          title="Execution History"
          description="Log trails of all automation checks executed on recent ticket mutations."
          columns={logsColumns}
          data={logsRes?.data ?? []}
          loading={isLogsLoading}
          error={logsErr ? (logsErr as any).message : null}
          searchQuery=""
          onSearchChange={() => {}}
          activeFilters={{}}
          onFilterChange={() => {}}
          onClearFilters={() => {}}
          pageIndex={logsPage}
          pageCount={logsRes?.pageCount ?? 1}
          onPageChange={setLogsPage}
          onRetry={refetchLogs}
        />
      )}

      {/* ── CREATE DIALOG ─────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Automation Rule"
        description="Trigger updates automatically based on a set of criteria."
        onSubmit={handleCreateSubmit}
        submitLabel="Create Rule"
        isSubmitting={createMutation.isPending}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Rule Name *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Escalate Network Outages"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this automation path achieves..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Trigger Event
              </label>
              <Select
                value={form.trigger}
                onValueChange={(v: any) => setForm((p) => ({ ...p, trigger: v }))}
              >
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_CREATE">On Creation</SelectItem>
                  <SelectItem value="ON_UPDATE">On General Update</SelectItem>
                  <SelectItem value="ON_STATUS_CHANGE">On Status Mutation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Priority Index (Order)
              </label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* CONDITIONS BUILDER */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Conditions (All must match)</span>
              <button
                type="button"
                onClick={() => handleAddCondition(false)}
                className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Condition
              </button>
            </div>
            <div className="space-y-2">
              {form.conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={cond.field}
                    onValueChange={(v: any) => handleUpdateCondition(false, idx, "field", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-1/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="categoryId">Category</SelectItem>
                      <SelectItem value="departmentId">Department</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={cond.operator}
                    onValueChange={(v: any) => handleUpdateCondition(false, idx, "operator", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-1/4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">is equal to</SelectItem>
                      <SelectItem value="neq">is not equal to</SelectItem>
                      <SelectItem value="is_null">is empty</SelectItem>
                      <SelectItem value="is_not_null">is not empty</SelectItem>
                    </SelectContent>
                  </Select>

                  {cond.operator !== "is_null" && cond.operator !== "is_not_null" && (
                    <div className="flex-1">
                      {renderValueInput(false, idx, cond.field)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(false, idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS BUILDER */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Actions Executed</span>
              <button
                type="button"
                onClick={() => handleAddAction(false)}
                className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Action
              </button>
            </div>
            <div className="space-y-2">
              {form.actions.map((act, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={act.type}
                    onValueChange={(v: any) => handleUpdateAction(false, idx, "type", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-5/12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGN_TO">Assign Ticket to User</SelectItem>
                      <SelectItem value="SET_PRIORITY">Set Priority</SelectItem>
                      <SelectItem value="SET_STATUS">Set Status</SelectItem>
                      <SelectItem value="ADD_COMMENT">Post Internal Comment</SelectItem>
                      <SelectItem value="SET_DEPARTMENT">Re-route to Department</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    {renderActionValueInput(false, idx, act.type)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAction(false, idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ── EDIT DIALOG ───────────────────────────────────────────────────── */}
      <CRUDDialogTemplate
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Update Automation Rule: ${editTarget?.name}`}
        description="Make adjustments to triggers, conditions, or actions."
        onSubmit={handleUpdateSubmit}
        submitLabel="Save Adjustments"
        isSubmitting={updateMutation.isPending}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Rule Name *
            </label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Escalate Network Outages"
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe what this automation path achieves..."
              rows={2}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Trigger Event
              </label>
              <Select
                value={editForm.trigger}
                onValueChange={(v: any) => setEditForm((p) => ({ ...p, trigger: v }))}
              >
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_CREATE">On Creation</SelectItem>
                  <SelectItem value="ON_UPDATE">On General Update</SelectItem>
                  <SelectItem value="ON_STATUS_CHANGE">On Status Mutation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                Order
              </label>
              <Input
                type="number"
                value={editForm.priority}
                onChange={(e) => setEditForm((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                className="text-xs h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-is-active"
              checked={editForm.isActive}
              onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="size-4 rounded accent-primary"
            />
            <label htmlFor="edit-is-active" className="text-xs font-bold text-muted-foreground cursor-pointer select-none">
              Rule is active and processing events
            </label>
          </div>

          {/* CONDITIONS BUILDER */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Conditions (All must match)</span>
              <button
                type="button"
                onClick={() => handleAddCondition(true)}
                className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Condition
              </button>
            </div>
            <div className="space-y-2">
              {editForm.conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={cond.field}
                    onValueChange={(v: any) => handleUpdateCondition(true, idx, "field", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-1/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="categoryId">Category</SelectItem>
                      <SelectItem value="departmentId">Department</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={cond.operator}
                    onValueChange={(v: any) => handleUpdateCondition(true, idx, "operator", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-1/4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">is equal to</SelectItem>
                      <SelectItem value="neq">is not equal to</SelectItem>
                      <SelectItem value="is_null">is empty</SelectItem>
                      <SelectItem value="is_not_null">is not empty</SelectItem>
                    </SelectContent>
                  </Select>

                  {cond.operator !== "is_null" && cond.operator !== "is_not_null" && (
                    <div className="flex-1">
                      {renderValueInput(true, idx, cond.field)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(true, idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS BUILDER */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Actions Executed</span>
              <button
                type="button"
                onClick={() => handleAddAction(true)}
                className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3" /> Add Action
              </button>
            </div>
            <div className="space-y-2">
              {editForm.actions.map((act, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    value={act.type}
                    onValueChange={(v: any) => handleUpdateAction(true, idx, "type", v)}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card w-5/12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGN_TO">Assign Ticket to User</SelectItem>
                      <SelectItem value="SET_PRIORITY">Set Priority</SelectItem>
                      <SelectItem value="SET_STATUS">Set Status</SelectItem>
                      <SelectItem value="ADD_COMMENT">Post Internal Comment</SelectItem>
                      <SelectItem value="SET_DEPARTMENT">Re-route to Department</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    {renderActionValueInput(true, idx, act.type)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAction(true, idx)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CRUDDialogTemplate>
    </>
  );
}

export default AutomationPage;
