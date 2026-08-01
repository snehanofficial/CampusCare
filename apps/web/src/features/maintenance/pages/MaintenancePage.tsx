import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Wrench,
  UserCheck,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  CalendarCheck,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Save,
  Layers,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import { EntityListTemplate } from "../../../components/templates/EntityListTemplate.js";
import { assetRepository } from "../../../lib/repositories/asset.repository.js";
import { maintenanceRepository } from "../../../lib/repositories/maintenance.repository.js";
import { departmentRepository } from "../../../lib/repositories/department.repository.js";
import { Tag } from "../../../components/ui/tag.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { CRUDDialogTemplate } from "../../../components/templates/CRUDDialogTemplate.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { Input } from "../../../components/ui/input.js";
import { Button } from "../../../components/ui/button.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { formatDate } from "@campuscare/shared-utils";
import type { ColumnDef, ColumnPinningState, ColumnSizingState, VisibilityState } from "@tanstack/react-table";
import type { MaintenanceRecord, Asset } from "@campuscare/shared-types";

export function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelectAll = (checked: boolean, rows: MaintenanceRecord[]) => {
    if (checked) {
      setSelectedIds(rows.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };
  const toggleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // React Table Sizing, Pinning & Visibility States
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Online / Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored. Write operations enabled.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network connection lost. Switch to read-only mode.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Saved Views State
  const [savedViews, setSavedViews] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem("campuscare_maintenance_views");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedView, setSelectedView] = useState<string>("");
  const [newViewName, setNewViewName] = useState<string>("");

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const viewConfig = {
      search,
      filters,
      columnPinning,
      columnSizing,
      columnVisibility,
    };
    const updated = { ...savedViews, [newViewName]: viewConfig };
    setSavedViews(updated);
    localStorage.setItem("campuscare_maintenance_views", JSON.stringify(updated));
    setSelectedView(newViewName);
    setNewViewName("");
    toast.success(`View "${newViewName}" saved successfully`);
  };

  const handleApplyView = (name: string) => {
    const view = savedViews[name];
    if (!view) return;
    setSearch(view.search || "");
    setFilters(view.filters || {});
    setColumnPinning(view.columnPinning || { left: [], right: [] });
    setColumnSizing(view.columnSizing || {});
    setColumnVisibility(view.columnVisibility || {});
    setSelectedView(name);
    toast.success(`Applied view "${name}"`);
  };

  const handleDeleteView = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...savedViews };
    delete updated[name];
    setSavedViews(updated);
    localStorage.setItem("campuscare_maintenance_views", JSON.stringify(updated));
    if (selectedView === name) {
      setSelectedView("");
    }
    toast.success(`Deleted view "${name}"`);
  };

  // Maintenance Filters state
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "",
    priority: "",
    type: "",
    technicianId: "",
  });

  // Selected Record state for actions
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  // Dialog States
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Form states for Schedule
  const [schedAssetId, setSchedAssetId] = useState("");
  const [schedType, setSchedType] = useState("PREVENTIVE");
  const [schedTechId, setSchedTechId] = useState("");
  const [schedPriority, setSchedPriority] = useState("MEDIUM");
  const [schedRecurrence, setSchedRecurrence] = useState("ONE_TIME");
  const [schedDate, setSchedDate] = useState("");
  const [schedDuration, setSchedDuration] = useState("60");
  const [schedNotes, setSchedNotes] = useState("");

  // Form states for Assign
  const [assignTechId, setAssignTechId] = useState("");

  // Form states for Complete
  const [completeDuration, setCompleteDuration] = useState("60");
  const [completeOutcome, setCompleteOutcome] = useState("SUCCESSFUL");
  const [completeNotes, setCompleteNotes] = useState("");

  // Form states for Cancel
  const [cancelReason, setCancelReason] = useState("");

  // Queries
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["maintenance-records", search, filters],
    queryFn: () => maintenanceRepository.list({ search, ...filters }),
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ["maintenance-summary"],
    queryFn: () => maintenanceRepository.getSummary(),
  });

  const { data: technicians } = useQuery({
    queryKey: ["maintenance-technicians"],
    queryFn: () => maintenanceRepository.getTechnicians(),
  });

  const { data: assetsRes } = useQuery({
    queryKey: ["assets-list"],
    queryFn: () => assetRepository.list({ pageSize: 100 }),
  });

  const activeAssets = (assetsRes?.data || []).filter(
    (a) => a.lifecycleStage !== "RETIRED" && a.lifecycleStage !== "DISPOSED"
  );
  const techList = technicians || [];

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.createSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Maintenance service scheduled successfully.");
      setIsScheduleOpen(false);
      resetScheduleForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule service.");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { id: string; technicianId: string | null; clientUpdatedAt?: string | null }) =>
      maintenanceRepository.assignTechnician(payload.id, {
        technicianId: payload.technicianId,
        clientUpdatedAt: payload.clientUpdatedAt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Technician assigned successfully.");
      setIsAssignOpen(false);
      setSelectedRecord(null);
      setAssignTechId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign technician.");
    },
  });

  const bulkScheduleMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.bulkSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Bulk services scheduled successfully.");
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule bulk services.");
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (payload: { recordIds: string[]; technicianId: string | null }) =>
      maintenanceRepository.bulkAssign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Bulk technicians assigned successfully.");
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed bulk assignment.");
    },
  });

  const startMutation = useMutation({
    mutationFn: (payload: { id: string; clientUpdatedAt?: string | null }) =>
      maintenanceRepository.startMaintenance(payload.id, { clientUpdatedAt: payload.clientUpdatedAt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Maintenance execution started.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start maintenance.");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { id: string; actualDuration: number; outcome: string; completionNotes?: string | null; clientUpdatedAt?: string | null }) =>
      maintenanceRepository.completeMaintenance(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Maintenance marked as completed.");
      setIsCompleteOpen(false);
      setSelectedRecord(null);
      resetCompleteForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete maintenance.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (payload: { id: string; cancellationReason: string; clientUpdatedAt?: string | null }) =>
      maintenanceRepository.cancelMaintenance(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success("Maintenance cancelled successfully.");
      setIsCancelOpen(false);
      setSelectedRecord(null);
      setCancelReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel maintenance.");
    },
  });

  const triggerAutomationMutation = useMutation({
    mutationFn: () => maintenanceRepository.triggerAutomation(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-summary"] });
      toast.success(`Automation completed. Generated ${data?.generatedCount || 0} recurring runs.`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to run automation rules.");
    },
  });

  // Helpers
  const resetScheduleForm = () => {
    setSchedAssetId("");
    setSchedType("PREVENTIVE");
    setSchedTechId("");
    setSchedPriority("MEDIUM");
    setSchedRecurrence("ONE_TIME");
    setSchedDate("");
    setSchedDuration("60");
    setSchedNotes("");
  };

  const resetCompleteForm = () => {
    setCompleteDuration("60");
    setCompleteOutcome("SUCCESSFUL");
    setCompleteNotes("");
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedAssetId) {
      toast.error("Please select an asset.");
      return;
    }
    if (!schedDate) {
      toast.error("Please select a scheduled date.");
      return;
    }

    scheduleMutation.mutate({
      assetId: schedAssetId,
      type: schedType,
      technicianId: schedTechId || null,
      priority: schedPriority,
      recurrence: schedRecurrence,
      scheduledDate: new Date(schedDate).toISOString(),
      estimatedDuration: parseInt(schedDuration) || 60,
      notes: schedNotes || null,
    });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    assignMutation.mutate({
      id: selectedRecord.id,
      technicianId: assignTechId || null,
      clientUpdatedAt: (selectedRecord as any).updatedAt,
    });
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    completeMutation.mutate({
      id: selectedRecord.id,
      actualDuration: parseInt(completeDuration) || 60,
      outcome: completeOutcome,
      completionNotes: completeNotes || null,
      clientUpdatedAt: (selectedRecord as any).updatedAt,
    });
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!cancelReason.trim()) {
      toast.error("Cancellation reason is required.");
      return;
    }
    cancelMutation.mutate({
      id: selectedRecord.id,
      cancellationReason: cancelReason,
      clientUpdatedAt: (selectedRecord as any).updatedAt,
    });
  };

  // Color Mapping Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "primary";
      case "ASSIGNED":
        return "info";
      case "IN_PROGRESS":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "primary";
      case "LOW":
      default:
        return "secondary";
    }
  };

  const getOutcomeColor = (o: string) => {
    switch (o) {
      case "SUCCESSFUL":
        return "success";
      case "PARTIALLY_COMPLETED":
        return "warning";
      case "FAILED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={response?.data?.length ? selectedIds.length === response.data.length : false}
          onChange={(e) => toggleSelectAll(e.target.checked, response?.data || [])}
          className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => toggleSelectRow(e.target.checked, row.original.id)}
          className="rounded border-border text-primary focus:ring-primary size-3.5 cursor-pointer"
        />
      ),
    },
    {
      accessorKey: "type",
      header: "Service Type",
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-xs text-foreground truncate block">
            {row.getValue("type")}
          </span>
          {row.original.scheduleId && (
            <span className="text-[9px] text-primary font-bold uppercase tracking-wide">
              Recurring Schedule
            </span>
          )}
        </div>
      ),
    },
    {
      id: "asset",
      header: "Asset",
      cell: ({ row }) => {
        const asset = (row.original as any).asset;
        return asset ? (
          <div>
            <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{asset.name}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{asset.tag}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "technician",
      header: "Technician",
      cell: ({ row }) => {
        const tech = (row.original as any).technician;
        return tech ? (
          <span className="text-xs font-semibold text-foreground">
            {tech.firstName} {tech.lastName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-semibold italic">Unassigned</span>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Tag variant={getPriorityColor(row.getValue("priority"))}>
          {row.getValue("priority")}
        </Tag>
      ),
    },
    {
      accessorKey: "scheduledDate",
      header: "Schedule Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-semibold">
          {formatDate(row.getValue("scheduledDate"))}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Tag variant={getStatusColor(row.getValue("status"))}>
            {row.getValue("status")}
          </Tag>
          {row.original.outcome && (
            <div className="block mt-0.5">
              <Tag variant={getOutcomeColor(row.original.outcome)} className="text-[9px]">
                {row.original.outcome}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const r = row.original;
        const isTerminal =
          r.status === "COMPLETED" || r.status === "CANCELLED" || r.status === "ARCHIVED";

        return (
          <div className="flex justify-end gap-1">
            {!isTerminal && (
              <>
                {(r.status === "SCHEDULED" || r.status === "ASSIGNED") && (
                  <button
                    onClick={() => {
                      setSelectedRecord(r);
                      setAssignTechId(r.technicianId || "");
                      setIsAssignOpen(true);
                    }}
                    className="p-1 hover:bg-primary/10 text-primary rounded cursor-pointer focus:outline-none"
                    title="Assign Tech"
                  >
                    <UserCheck className="size-3.5" />
                  </button>
                )}
                {(r.status === "SCHEDULED" || r.status === "ASSIGNED") && (
                  <button
                    onClick={() =>
                      startMutation.mutate({ id: r.id, clientUpdatedAt: (r as any).updatedAt })
                    }
                    className="p-1 hover:bg-green-500/10 text-green-500 rounded cursor-pointer focus:outline-none"
                    title="Start Execution"
                  >
                    <Play className="size-3.5" />
                  </button>
                )}
                {r.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => {
                      setSelectedRecord(r);
                      setCompleteDuration(String(r.estimatedDuration));
                      setIsCompleteOpen(true);
                    }}
                    className="p-1 hover:bg-green-500/10 text-green-600 rounded cursor-pointer focus:outline-none"
                    title="Complete Service"
                  >
                    <CheckCircle className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedRecord(r);
                    setIsCancelOpen(true);
                  }}
                  className="p-1 hover:bg-destructive/10 text-destructive rounded cursor-pointer focus:outline-none"
                  title="Cancel Maintenance"
                >
                  <XCircle className="size-3.5" />
                </button>
              </>
            )}
            {isTerminal && (
              <span className="text-[10px] text-muted-foreground font-bold uppercase select-none p-1">
                Completed
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Offline Read-Only Banner */}
      {!isOnline && (
        <div className="bg-amber-950/40 border border-amber-500/50 p-3 rounded-lg text-amber-400 text-sm font-semibold flex items-center justify-between gap-4 mb-4">
          <span className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500" />
            You are currently offline. CampusCare is running in read-only mode. Database modifications are disabled.
          </span>
          <span className="bg-amber-500/20 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase text-amber-300">Offline Mode</span>
        </div>
      )}

      {/* 1. Dashboard summary widgets */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Scheduled Today</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">{summary?.scheduledToday ?? 0}</span>
            <CalendarCheck className="size-4 text-primary" />
          </div>
        </Card>
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Upcoming</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">{summary?.upcoming ?? 0}</span>
            <Clock className="size-4 text-info" />
          </div>
        </Card>
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Overdue</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-extrabold ${(summary?.overdue ?? 0) > 0 ? "text-destructive" : "text-foreground"}`}>
              {summary?.overdue ?? 0}
            </span>
            <AlertTriangle className={`size-4 ${(summary?.overdue ?? 0) > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
        </Card>
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">In Progress</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-warning">{summary?.inProgress ?? 0}</span>
            <Wrench className="size-4 text-warning" />
          </div>
        </Card>
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Completed (30d)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">{summary?.completed ?? 0}</span>
            <CheckCircle2 className="size-4 text-success" />
          </div>
        </Card>
        <Card className="rounded-sm border border-border bg-card p-3 flex flex-col justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase">Assets Under Service</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">{summary?.assetSummary ?? 0}</span>
            <AlertOctagon className="size-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Toolbar controls */}
      <div className="flex items-center justify-between border-b border-border pb-2 gap-2">
        <div className="flex items-center gap-1.5 bg-muted p-0.5 rounded-sm">
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-sm focus:outline-none cursor-pointer transition-colors ${
              viewMode === "list"
                ? "bg-card text-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
          >
            <ListIcon className="size-3.5" />
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-1.5 rounded-sm focus:outline-none cursor-pointer transition-colors ${
              viewMode === "calendar"
                ? "bg-card text-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Calendar View"
          >
            <CalendarIcon className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerAutomationMutation.mutate()}
            disabled={triggerAutomationMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-sm cursor-pointer focus:outline-none disabled:opacity-50"
            title="Run recurring calculations"
          >
            <RefreshCw className={`size-3.5 ${triggerAutomationMutation.isPending ? "animate-spin" : ""}`} />
            Run Rules
          </button>
          <button
            onClick={() => {
              resetScheduleForm();
              setIsScheduleOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-sm cursor-pointer hover:bg-primary/95 focus:outline-none"
          >
            <Wrench className="size-3.5" />
            Schedule Service
          </button>
        </div>
      </div>

      {/* Main content body */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {/* Saved Views Control Panel */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-300">Saved Views:</span>
              <div className="flex gap-1.5 flex-wrap">
                {Object.keys(savedViews).length === 0 ? (
                  <span className="text-zinc-500 text-xs py-1">No saved views</span>
                ) : (
                  Object.keys(savedViews).map((name) => (
                    <Button
                      key={name}
                      variant={selectedView === name ? "default" : "outline"}
                      size="xs"
                      onClick={() => handleApplyView(name)}
                      className="h-7 text-xs flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300"
                    >
                      {name}
                      <Trash2
                        className="h-3 w-3 text-red-400 hover:text-red-600 ml-1 cursor-pointer"
                        onClick={(e) => handleDeleteView(name, e)}
                      />
                    </Button>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="New view name..."
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                className="h-8 max-w-[160px] text-xs bg-zinc-950 border-zinc-800 text-zinc-300"
              />
              <Button onClick={handleSaveView} size="xs" variant="outline" className="h-8 gap-1 text-zinc-300 border-zinc-700">
                <Save className="h-3.5 w-3.5" />
                Save View
              </Button>
            </div>
          </div>

          <EntityListTemplate
            title="University Maintenance Registry"
            description="Track hardware preventive checks, corrective repair orders, and technician dispatches."
            columns={columns}
            data={response?.data || []}
            loading={isLoading}
            error={error ? (error as Error).message : null}
            searchQuery={search}
            onSearchChange={setSearch}
            filterOptions={[
              {
                key: "status",
                label: "Status Filter",
                options: [
                  { value: "SCHEDULED", label: "Scheduled" },
                  { value: "ASSIGNED", label: "Assigned" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ],
              },
              {
                key: "priority",
                label: "Priority Filter",
                options: [
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "CRITICAL", label: "Critical" },
                ],
              },
              {
                key: "type",
                label: "Type Filter",
                options: [
                  { value: "PREVENTIVE", label: "Preventive" },
                  { value: "CORRECTIVE", label: "Corrective" },
                  { value: "INSPECTION", label: "Inspection" },
                  { value: "CALIBRATION", label: "Calibration" },
                  { value: "SOFTWARE_UPDATE", label: "Software Update" },
                  { value: "HARDWARE_REPAIR", label: "Hardware Repair" },
                ],
              },
              {
                key: "technicianId",
                label: "Technician Filter",
                options: techList.map((t: any) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
              },
            ]}
            activeFilters={filters}
            onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
            onClearFilters={() => {
              setSearch("");
              setFilters({ status: "", priority: "", type: "", technicianId: "" });
            }}
            actions={[
              {
                label: "Run Rules",
                onClick: () => triggerAutomationMutation.mutate(),
                icon: RefreshCw,
                disabled: !isOnline,
              },
              {
                label: "Schedule Service",
                onClick: () => {
                  resetScheduleForm();
                  setIsScheduleOpen(true);
                },
                icon: Wrench,
                disabled: !isOnline,
              },
            ]}
            selectedCount={selectedIds.length}
            bulkActions={[
              {
                label: "Assign Technician",
                onClick: () => {
                  if (selectedIds.length === 0) return;
                  const techId = prompt("Enter target Technician User ID (leave empty to unassign):");
                  if (techId === null) return;
                  bulkAssignMutation.mutate({ recordIds: selectedIds, technicianId: techId || null });
                },
                icon: UserCheck,
                disabled: !isOnline,
              },
            ]}
            pageIndex={response?.page || 1}
            pageCount={response?.pageCount || 1}
            onPageChange={(page) => refetch()}
            onRetry={refetch}
            columnPinning={columnPinning}
            onColumnPinningChange={setColumnPinning}
            columnSizing={columnSizing}
            onColumnSizingChange={setColumnSizing}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>
      ) : (
        <Card className="rounded-sm border border-border bg-card">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="text-xs font-extrabold uppercase text-primary">
              Upcoming Schedule Calendar (Grouped By Date)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {response?.data && response.data.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(
                  response.data.reduce((groups: any, record: any) => {
                    const dateStr = new Date(record.scheduledDate).toDateString();
                    if (!groups[dateStr]) groups[dateStr] = [];
                    groups[dateStr].push(record);
                    return groups;
                  }, {})
                ).map(([dateStr, items]: any) => (
                  <div key={dateStr} className="space-y-1.5">
                    <h3 className="text-xs font-bold text-foreground border-b border-border pb-1 select-none">
                      {dateStr}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map((r: MaintenanceRecord) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-sm border border-border bg-surface-subtle/50 flex flex-col justify-between"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                                {r.type}
                              </span>
                              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                                Asset: {(r as any).asset?.name || "Unknown"}
                              </p>
                            </div>
                            <Tag variant={getStatusColor(r.status)}>{r.status}</Tag>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/30 text-[10px]">
                            <span className="text-muted-foreground font-semibold">
                              Est Duration: {r.estimatedDuration}m
                            </span>
                            <span className="font-bold text-foreground">
                              {(r as any).technician
                                ? `Tech: ${(r as any).technician.firstName}`
                                : "Unassigned"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                No maintenance tasks scheduled.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          MODALS / DIALOGS FOR MAINTENANCE OPERATIONS
          ========================================== */}

      {/* SCHEDULE SERVICE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Maintenance"
        description="Configure recurrence rules and schedule service dispatches."
        onSubmit={handleScheduleSubmit}
        submitLabel="Create Schedule"
        isSubmitting={scheduleMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Asset *</label>
            <Select value={schedAssetId} onValueChange={setSchedAssetId}>
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select asset to service" />
              </SelectTrigger>
              <SelectContent>
                {activeAssets.map((a: Asset) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.tag})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Type</label>
              <Select value={schedType} onValueChange={setSchedType}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREVENTIVE">Preventive Maintenance</SelectItem>
                  <SelectItem value="CORRECTIVE">Corrective Repair</SelectItem>
                  <SelectItem value="INSPECTION">Inspection check</SelectItem>
                  <SelectItem value="CALIBRATION">Calibration testing</SelectItem>
                  <SelectItem value="SOFTWARE_UPDATE">Software Patch/Update</SelectItem>
                  <SelectItem value="HARDWARE_REPAIR">Hardware Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</label>
              <Select value={schedPriority} onValueChange={setSchedPriority}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Technician</label>
              <Select value={schedTechId} onValueChange={setSchedTechId}>
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Assign tech (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {techList.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Recurrence Frequency</label>
              <Select value={schedRecurrence} onValueChange={setSchedRecurrence}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_TIME">One-Time Run</SelectItem>
                  <SelectItem value="WEEKLY">Weekly recurrence</SelectItem>
                  <SelectItem value="MONTHLY">Monthly recurrence</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly recurrence</SelectItem>
                  <SelectItem value="HALF_YEARLY">Half-Yearly recurrence</SelectItem>
                  <SelectItem value="ANNUAL">Annual recurrence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Schedule Date *</label>
              <Input
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Duration (mins)</label>
              <Input
                type="number"
                value={schedDuration}
                onChange={(e) => setSchedDuration(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Pre-service Notes</label>
            <Textarea
              value={schedNotes}
              onChange={(e) => setSchedNotes(e.target.value)}
              placeholder="Specify initial details of issues or checklist goals..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ASSIGN TECHNICIAN DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Dispatch Technician"
        description="Allocate this maintenance dispatch ticket to an active technician."
        onSubmit={handleAssignSubmit}
        submitLabel="Assign Technician"
        isSubmitting={assignMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Choose Technician *</label>
            <Select value={assignTechId} onValueChange={setAssignTechId}>
              <SelectTrigger className="text-xs h-9 bg-card">
                <SelectValue placeholder="Select Technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {techList.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* COMPLETE MAINTENANCE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        title="Resolve Maintenance Dispatch"
        description="Input actual service performance metrics and notes to close the record."
        onSubmit={handleCompleteSubmit}
        submitLabel="Resolve & Complete"
        isSubmitting={completeMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Actual Duration (mins) *</label>
              <Input
                type="number"
                value={completeDuration}
                onChange={(e) => setCompleteDuration(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Outcome *</label>
              <Select value={completeOutcome} onValueChange={setCompleteOutcome}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESSFUL">Successful resolution</SelectItem>
                  <SelectItem value="PARTIALLY_COMPLETED">Partially completed checks</SelectItem>
                  <SelectItem value="FAILED">Unsuccessful / Failed run</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Resolution Notes</label>
            <Textarea
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="Record any actions taken, part changes, or recommendations..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* CANCEL MAINTENANCE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Maintenance Schedule"
        description="Cancel this service record. A valid reason must be logged."
        onSubmit={handleCancelSubmit}
        submitLabel="Cancel Record"
        isSubmitting={cancelMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Cancellation Reason *</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Explain why this maintenance cannot be performed..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </div>
  );
}
export default MaintenancePage;
