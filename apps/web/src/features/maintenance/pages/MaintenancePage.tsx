import React, { useState } from "react";
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
  RefreshCw
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
import { Textarea } from "../../../components/ui/textarea.js";
import { formatDate } from "@campuscare/shared-utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { MaintenanceRecord, Asset } from "@campuscare/shared-types";

export function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

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
    queryKey: ["maintenance-records", search],
    queryFn: () => maintenanceRepository.list({ search }),
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
        <EntityListTemplate
          title="University Maintenance Registry"
          description="Track hardware preventive checks, corrective repair orders, and technician dispatches."
          columns={columns}
          data={response?.data || []}
          loading={isLoading}
          error={error ? (error as Error).message : null}
          searchQuery={search}
          onSearchChange={setSearch}
          activeFilters={{}}
          onFilterChange={() => {}}
          onClearFilters={() => setSearch("")}
          actions={[]}
          pageIndex={response?.page || 1}
          pageCount={response?.pageCount || 1}
          onPageChange={() => {}}
          onRetry={refetch}
        />
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
