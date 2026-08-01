import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Tag as TagIcon,
  Server,
  Shield,
  FileText,
  Clipboard,
  Clock,
  Heart,
  CheckSquare,
  Undo,
  ArrowLeftRight,
  Wrench,
  UserCheck,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { assetRepository } from "@/lib/repositories/asset.repository.js";
import { departmentRepository } from "@/lib/repositories/department.repository.js";
import { userRepository } from "@/lib/repositories/user.repository.js";
import { maintenanceRepository } from "@/lib/repositories/maintenance.repository.js";
import { Tag } from "@/components/ui/tag.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.js";
import { PageSkeleton } from "@/components/feedback/PageSkeleton.js";
import { formatDate } from "@campuscare/shared-utils";
import { AssetStatus, LifecycleStage, HealthStatus } from "@campuscare/shared-types";
import { CRUDDialogTemplate } from "@/components/templates/CRUDDialogTemplate.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "maintenance" | "relations" | "documents" | "activity">("overview");

  // Dialog States
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);

  // Form States
  const [assigneeType, setAssigneeType] = useState<"USER" | "DEPARTMENT" | "LOCATION">("USER");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [assigneeDeptId, setAssigneeDeptId] = useState("");
  const [assigneeLoc, setAssigneeLoc] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const [transferType, setTransferType] = useState<"USER" | "DEPARTMENT" | "LOCATION">("USER");
  const [transferUserId, setTransferUserId] = useState("");
  const [transferDeptId, setTransferDeptId] = useState("");
  const [transferLoc, setTransferLoc] = useState("");
  const [transferBuilding, setTransferBuilding] = useState("");
  const [transferFloor, setTransferFloor] = useState("");
  const [transferRoom, setTransferRoom] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const [returnNotes, setReturnNotes] = useState("");

  const [targetStage, setTargetStage] = useState<LifecycleStage>(LifecycleStage.AVAILABLE);
  const [lifecycleNotes, setLifecycleNotes] = useState("");

  // Maintenance Dialog States
  const [isSchedMaintOpen, setIsSchedMaintOpen] = useState(false);
  const [isAssignMaintOpen, setIsAssignMaintOpen] = useState(false);
  const [isCompleteMaintOpen, setIsCompleteMaintOpen] = useState(false);
  const [isCancelMaintOpen, setIsCancelMaintOpen] = useState(false);
  const [selectedMaintRecord, setSelectedMaintRecord] = useState<any>(null);

  // Maintenance Form States
  const [maintType, setMaintType] = useState("PREVENTIVE");
  const [maintTechId, setMaintTechId] = useState("");
  const [maintPriority, setMaintPriority] = useState("MEDIUM");
  const [maintRecurrence, setMaintRecurrence] = useState("ONE_TIME");
  const [maintDate, setMaintDate] = useState("");
  const [maintDuration, setMaintDuration] = useState("60");
  const [maintNotes, setMaintNotes] = useState("");

  const [maintAssignTechId, setMaintAssignTechId] = useState("");
  const [maintCompleteDuration, setMaintCompleteDuration] = useState("60");
  const [maintCompleteOutcome, setMaintCompleteOutcome] = useState("SUCCESSFUL");
  const [maintCompleteNotes, setMaintCompleteNotes] = useState("");
  const [maintCancelReason, setMaintCancelReason] = useState("");

  // Queries
  const { data: asset, isLoading, error, refetch } = useQuery({
    queryKey: ["asset", id],
    queryFn: () => assetRepository.get(id!),
    enabled: !!id,
  });

  const { data: deptsRes } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ["users-assignment"],
    queryFn: () => userRepository.list(),
  });

  const departmentsList = deptsRes?.data || [];
  const usersList = usersRes?.data || [];

  // Mutations
  const assignMutation = useMutation({
    mutationFn: (payload: any) => assetRepository.assignAsset(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Asset assigned successfully.");
      setIsAssignOpen(false);
      resetAssignForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign asset.");
    }
  });

  const returnMutation = useMutation({
    mutationFn: (payload: any) => assetRepository.returnAsset(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Asset returned to inventory.");
      setIsReturnOpen(false);
      setReturnNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to return asset.");
    }
  });

  const transferMutation = useMutation({
    mutationFn: (payload: any) => assetRepository.transferAsset(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Asset transferred successfully.");
      setIsTransferOpen(false);
      resetTransferForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to transfer asset.");
    }
  });

  const changeLifecycleMutation = useMutation({
    mutationFn: (payload: any) => assetRepository.changeAssetLifecycle(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      toast.success("Asset lifecycle stage changed.");
      setIsLifecycleOpen(false);
      setLifecycleNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to change lifecycle stage.");
    }
  });

  // Maintenance queries
  const { data: maintenanceRes } = useQuery({
    queryKey: ["asset-maintenance", id],
    queryFn: () => maintenanceRepository.list({ filters: { assetId: id } }),
    enabled: !!id,
  });

  const { data: technicians } = useQuery({
    queryKey: ["maintenance-technicians"],
    queryFn: () => maintenanceRepository.getTechnicians(),
  });

  const maintenanceRecords = maintenanceRes?.data || [];
  const techList = technicians || [];

  // Maintenance Mutations
  const scheduleMaintMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.createSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
      toast.success("Maintenance schedule created.");
      setIsSchedMaintOpen(false);
      resetScheduleMaintForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule maintenance.");
    }
  });

  const assignMaintMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.assignTechnician(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
      toast.success("Technician assigned.");
      setIsAssignMaintOpen(false);
      setSelectedMaintRecord(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign technician.");
    }
  });

  const startMaintMutation = useMutation({
    mutationFn: (payload: { id: string; clientUpdatedAt?: string | null }) =>
      maintenanceRepository.startMaintenance(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
      toast.success("Maintenance started.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start maintenance.");
    }
  });

  const completeMaintMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.completeMaintenance(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
      toast.success("Maintenance completed.");
      setIsCompleteMaintOpen(false);
      setSelectedMaintRecord(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete maintenance.");
    }
  });

  const cancelMaintMutation = useMutation({
    mutationFn: (payload: any) => maintenanceRepository.cancelMaintenance(payload.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance", id] });
      toast.success("Maintenance cancelled.");
      setIsCancelMaintOpen(false);
      setSelectedMaintRecord(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel maintenance.");
    }
  });

  const resetScheduleMaintForm = () => {
    setMaintType("PREVENTIVE");
    setMaintTechId("");
    setMaintPriority("MEDIUM");
    setMaintRecurrence("ONE_TIME");
    setMaintDate("");
    setMaintDuration("60");
    setMaintNotes("");
  };

  const handleScheduleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintDate) {
      toast.error("Scheduled date is required.");
      return;
    }
    scheduleMaintMutation.mutate({
      assetId: id!,
      type: maintType,
      technicianId: maintTechId || null,
      priority: maintPriority,
      recurrence: maintRecurrence,
      scheduledDate: new Date(maintDate).toISOString(),
      estimatedDuration: parseInt(maintDuration) || 60,
      notes: maintNotes || null,
    });
  };

  const handleAssignMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintRecord) return;
    assignMaintMutation.mutate({
      id: selectedMaintRecord.id,
      technicianId: maintAssignTechId || null,
      clientUpdatedAt: selectedMaintRecord.updatedAt,
    });
  };

  const handleCompleteMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintRecord) return;
    completeMaintMutation.mutate({
      id: selectedMaintRecord.id,
      actualDuration: parseInt(maintCompleteDuration) || 60,
      outcome: maintCompleteOutcome,
      completionNotes: maintCompleteNotes || null,
      clientUpdatedAt: selectedMaintRecord.updatedAt,
    });
  };

  const handleCancelMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaintRecord) return;
    if (!maintCancelReason.trim()) {
      toast.error("Cancellation reason is required.");
      return;
    }
    cancelMaintMutation.mutate({
      id: selectedMaintRecord.id,
      cancellationReason: maintCancelReason,
      clientUpdatedAt: selectedMaintRecord.updatedAt,
    });
  };

  const resetAssignForm = () => {
    setAssigneeType("USER");
    setAssigneeUserId("");
    setAssigneeDeptId("");
    setAssigneeLoc("");
    setAssignmentNotes("");
  };

  const resetTransferForm = () => {
    setTransferType("USER");
    setTransferUserId("");
    setTransferDeptId("");
    setTransferLoc("");
    setTransferBuilding("");
    setTransferFloor("");
    setTransferRoom("");
    setTransferNotes("");
  };

  // Handlers
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigneeType === "USER" && !assigneeUserId) {
      toast.error("Please select a user.");
      return;
    }
    if (assigneeType === "DEPARTMENT" && !assigneeDeptId) {
      toast.error("Please select a department.");
      return;
    }
    if (assigneeType === "LOCATION" && !assigneeLoc.trim()) {
      toast.error("Please fill in location label.");
      return;
    }

    assignMutation.mutate({
      assigneeType,
      userId: assigneeType === "USER" ? assigneeUserId : undefined,
      departmentId: assigneeType === "DEPARTMENT" ? assigneeDeptId : undefined,
      location: assigneeType === "LOCATION" ? assigneeLoc : undefined,
      notes: assignmentNotes,
      clientUpdatedAt: asset?.updatedAt
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    returnMutation.mutate({
      notes: returnNotes,
      clientUpdatedAt: asset?.updatedAt
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferType === "USER" && !transferUserId) {
      toast.error("Please select a target user.");
      return;
    }
    if (transferType === "DEPARTMENT" && !transferDeptId) {
      toast.error("Please select a target department.");
      return;
    }
    if (transferType === "LOCATION" && !transferLoc.trim()) {
      toast.error("Please input location label.");
      return;
    }

    transferMutation.mutate({
      transferType,
      userId: transferType === "USER" ? transferUserId : undefined,
      departmentId: transferType === "DEPARTMENT" ? transferDeptId : undefined,
      location: transferLoc,
      building: transferType === "LOCATION" ? transferBuilding : undefined,
      floor: transferType === "LOCATION" ? transferFloor : undefined,
      room: transferType === "LOCATION" ? transferRoom : undefined,
      notes: transferNotes,
      clientUpdatedAt: asset?.updatedAt
    });
  };

  const handleLifecycleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changeLifecycleMutation.mutate({
      lifecycleStage: targetStage,
      notes: lifecycleNotes,
      clientUpdatedAt: asset?.updatedAt
    });
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-sm">
        <h3 className="text-sm font-bold text-destructive">Failed to Load Asset</h3>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message || "Asset not found."}</p>
        <button onClick={() => navigate("/assets")} className="mt-4 text-xs font-bold text-primary hover:underline cursor-pointer">
          Return to Registry
        </button>
      </div>
    );
  }

  // Color mappings
  const getStatusColor = (s: AssetStatus) => {
    switch (s) {
      case AssetStatus.OPERATIONAL:
        return "success";
      case AssetStatus.MAINTENANCE:
        return "warning";
      case AssetStatus.BROKEN:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getLifecycleColor = (l: LifecycleStage) => {
    switch (l) {
      case LifecycleStage.IN_USE:
      case LifecycleStage.ASSIGNED:
        return "success";
      case LifecycleStage.MAINTENANCE:
        return "warning";
      case LifecycleStage.RETIRED:
      case LifecycleStage.DISPOSED:
        return "destructive";
      default:
        return "primary";
    }
  };

  const getHealthColor = (h: HealthStatus) => {
    switch (h) {
      case HealthStatus.HEALTHY:
        return "success";
      case HealthStatus.MONITOR:
      case HealthStatus.WARNING:
        return "warning";
      case HealthStatus.CRITICAL:
      case HealthStatus.FAILING:
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getHistoryIndicatorColor = (action: string) => {
    switch (action) {
      case "CREATED":
        return "bg-green-500";
      case "ASSIGNED":
        return "bg-blue-500";
      case "RETURNED":
        return "bg-amber-500";
      case "TRANSFERRED":
        return "bg-purple-500";
      case "LIFECYCLE_CHANGED":
        return "bg-indigo-500";
      default:
        return "bg-primary";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Server },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "relations", label: "Relations", icon: Heart },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "activity", label: "Activity", icon: Clipboard },
  ] as const;

  const isAssigned = asset.lifecycleStage === LifecycleStage.ASSIGNED || asset.lifecycleStage === LifecycleStage.IN_USE;
  const isTerminal = asset.lifecycleStage === LifecycleStage.RETIRED || asset.lifecycleStage === LifecycleStage.DISPOSED;

  return (
    <div className="space-y-4">
      {/* Back button and title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/assets")}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider select-none">Asset ID: {asset.assetCode}</span>
            <h2 className="text-sm font-bold text-foreground">{asset.name}</h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-1.5">
          {!isAssigned && !isTerminal && (
            <button
              onClick={() => {
                resetAssignForm();
                setIsAssignOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
            >
              <CheckSquare className="size-3.5" />
              Assign
            </button>
          )}

          {isAssigned && (
            <>
              <button
                onClick={() => {
                  setReturnNotes("");
                  setIsReturnOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
              >
                <Undo className="size-3.5" />
                Return
              </button>
              <button
                onClick={() => {
                  resetTransferForm();
                  setIsTransferOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
              >
                <ArrowLeftRight className="size-3.5" />
                Transfer
              </button>
            </>
          )}

          <button
            disabled={isTerminal}
            onClick={() => {
              setTargetStage(asset.lifecycleStage);
              setLifecycleNotes("");
              setIsLifecycleOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-muted text-foreground text-xs font-bold rounded-sm cursor-pointer focus:outline-none disabled:opacity-50"
          >
            <Clipboard className="size-3.5" />
            Lifecycle
          </button>
        </div>
      </div>

      {/* Grid of status badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
            <Tag variant={getStatusColor(asset.status)}>{asset.status}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Lifecycle</span>
            <Tag variant={getLifecycleColor(asset.lifecycleStage)}>{asset.lifecycleStage}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Health</span>
            <Tag variant={getHealthColor(asset.healthStatus)}>{asset.healthStatus}</Tag>
          </CardContent>
        </Card>
        <Card className="rounded-sm border border-border bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tag</span>
            <span className="font-mono text-xs font-bold text-foreground">{asset.tag}</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold cursor-pointer focus:outline-none transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="mt-3">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Specifications</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Model / Brand</span>
                  <span className="text-foreground font-bold">{asset.model}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Manufacturer</span>
                  <span className="text-foreground font-bold">{asset.manufacturer || "Generic"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Serial Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.serialNumber || "SN-UNKNOWN"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Asset Category</span>
                  <span className="text-foreground font-bold">{(asset as any).category?.name || "None"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Department Scope</span>
                  <span className="text-foreground font-bold">{(asset as any).department?.name || "Global"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Physical Location</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><MapPin className="size-3.5" /> Building</span>
                  <span className="text-foreground font-bold">{asset.building || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><Server className="size-3.5" /> Floor</span>
                  <span className="text-foreground font-bold">{asset.floor || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><TagIcon className="size-3.5" /> Room / Office</span>
                  <span className="text-foreground font-bold">{asset.room || "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Full Location Text</span>
                  <span className="text-foreground font-semibold max-w-[200px] truncate">{asset.location}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "timeline" && (
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-xs font-extrabold uppercase text-primary">Lifecycle Timeline Logs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {(asset as any).history && (asset as any).history.length > 0 ? (
                <div className="relative border-l border-border pl-4 space-y-4 ml-2">
                  {(asset as any).history.map((h: any) => (
                    <div key={h.id} className="relative">
                      <div className={`absolute -left-[21px] mt-1 size-2 rounded-full border-2 border-background ${getHistoryIndicatorColor(h.actionType)}`} />
                      <div className="text-xs">
                        <span className="font-bold text-foreground mr-2">{h.actionType}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{formatDate(h.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.notes}</p>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                        <User className="size-3" /> Performed By: {h.performedBy ? `${h.performedBy.firstName} ${h.performedBy.lastName}` : "System"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No history records logged for this asset.</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "maintenance" && (
          <div className="space-y-4">
            {/* Quick Actions & Ongoing status */}
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border flex flex-row justify-between items-center">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Ongoing Maintenance status</CardTitle>
                {!isTerminal && (
                  <button
                    onClick={() => {
                      resetScheduleMaintForm();
                      setIsSchedMaintOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-sm cursor-pointer hover:bg-primary/95 focus:outline-none"
                  >
                    <Wrench className="size-3.5" />
                    Schedule Service
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const activeMaint = maintenanceRecords.find(
                    (r: any) =>
                      r.status === "SCHEDULED" ||
                      r.status === "ASSIGNED" ||
                      r.status === "IN_PROGRESS"
                  );
                  if (activeMaint) {
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-surface-subtle/50 border border-border/40 rounded-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground uppercase">
                              {activeMaint.type}
                            </span>
                            <Tag variant={
                              activeMaint.status === "IN_PROGRESS" ? "warning" : activeMaint.status === "ASSIGNED" ? "info" : "primary"
                            }>
                              {activeMaint.status}
                            </Tag>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Scheduled for: {formatDate(activeMaint.scheduledDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Assigned Tech: {(activeMaint as any).technician ? `${(activeMaint as any).technician.firstName} ${(activeMaint as any).technician.lastName}` : "Unassigned"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeMaint.status === "SCHEDULED" || activeMaint.status === "ASSIGNED") && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedMaintRecord(activeMaint);
                                  setMaintAssignTechId(activeMaint.technicianId || "");
                                  setIsAssignMaintOpen(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
                              >
                                <UserCheck className="size-3.5" />
                                Assign Tech
                              </button>
                              <button
                                onClick={() =>
                                  startMaintMutation.mutate({
                                    id: activeMaint.id,
                                    clientUpdatedAt: activeMaint.updatedAt ? new Date(activeMaint.updatedAt).toISOString() : null,
                                  })
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
                              >
                                <Play className="size-3.5" />
                                Start Service
                              </button>
                            </>
                          )}
                          {activeMaint.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => {
                                setSelectedMaintRecord(activeMaint);
                                setMaintCompleteDuration(String(activeMaint.estimatedDuration));
                                setIsCompleteMaintOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
                            >
                              <CheckCircle className="size-3.5" />
                              Complete Service
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMaintRecord(activeMaint);
                              setIsCancelMaintOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 text-xs font-bold rounded-sm cursor-pointer focus:outline-none"
                          >
                            <XCircle className="size-3.5" />
                            Cancel Service
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No active maintenance dispatches scheduled or running.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Upcoming Maintenance List */}
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Upcoming Maintenance runs</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const upcomingRuns = maintenanceRecords.filter(
                    (r: any) => r.status === "SCHEDULED" || r.status === "ASSIGNED"
                  );
                  if (upcomingRuns.length > 0) {
                    return (
                      <div className="space-y-2">
                        {upcomingRuns.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center border-b border-muted pb-2 last:border-b-0 last:pb-0">
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase">{r.type}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Scheduled: {formatDate(r.scheduledDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tag variant="primary">{r.priority}</Tag>
                              <Tag variant="info">{r.status}</Tag>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No upcoming maintenance runs.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Maintenance History */}
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Maintenance Service History</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(() => {
                  const historyRuns = maintenanceRecords.filter(
                    (r: any) => r.status === "COMPLETED" || r.status === "CANCELLED"
                  );
                  if (historyRuns.length > 0) {
                    return (
                      <div className="space-y-3.5">
                        {historyRuns.map((r: any) => (
                          <div key={r.id} className="border-b border-muted pb-3 last:border-b-0 last:pb-0 text-xs">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-bold text-foreground uppercase">{r.type}</span>
                                <span className="text-[10px] text-muted-foreground ml-2 font-semibold">
                                  {formatDate(r.endTime || r.scheduledDate)}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                <Tag variant={r.status === "COMPLETED" ? "success" : "destructive"}>{r.status}</Tag>
                                {r.outcome && <Tag variant={r.outcome === "SUCCESSFUL" ? "success" : r.outcome === "FAILED" ? "destructive" : "warning"}>{r.outcome}</Tag>}
                              </div>
                            </div>
                            {r.status === "COMPLETED" ? (
                              <div className="mt-1.5 space-y-1 text-muted-foreground">
                                <p><strong>Duration:</strong> {r.actualDuration} minutes (Est: {r.estimatedDuration}m)</p>
                                <p><strong>Completion Notes:</strong> {r.completionNotes || "No notes logged."}</p>
                              </div>
                            ) : (
                              <p className="mt-1.5 text-destructive font-semibold">
                                <strong>Cancellation Reason:</strong> {r.cancellationReason}
                              </p>
                            )}
                            <div className="text-[10px] text-muted-foreground font-bold mt-1">
                              Tech: {(r as any).technician ? `${(r as any).technician.firstName} ${(r as any).technician.lastName}` : "System"}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No historical maintenance logs for this asset.
                    </p>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "relations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Linked Support Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {(asset as any).tickets && (asset as any).tickets.length > 0 ? (
                  <div className="space-y-3.5">
                    {(asset as any).tickets.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between border-b border-muted pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="text-xs font-bold text-foreground">{t.ticketNumber}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{t.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag variant="primary">{t.priority}</Tag>
                          <span className="text-[10px] font-bold text-muted-foreground">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No open tickets linked to this asset tag.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Active Maintenance Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                <Shield className="size-6 text-muted-foreground/60 mb-1.5" />
                <p className="text-xs font-bold text-muted-foreground">Maintenance Operations</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Plugged in during Phase 4: Preventative maintenance</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Procurement Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Purchase PO Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.purchaseOrderNumber || "PO-NONE"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold flex items-center gap-0.5"><DollarSign className="size-3.5" /> Cost Price</span>
                  <span className="text-foreground font-bold">{asset.purchasePrice ? `$${asset.purchasePrice}` : "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1"><Calendar className="size-3.5" /> Purchase Date</span>
                  <span className="text-foreground font-bold">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-sm border border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-xs font-extrabold uppercase text-primary">Warranty / AMC Contract</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Contract Number</span>
                  <span className="text-foreground font-mono font-bold">{asset.contractNumber || "CON-NONE"}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-muted pb-1.5">
                  <span className="text-muted-foreground font-semibold">Warranty Start</span>
                  <span className="text-foreground font-bold">{asset.warrantyStart ? new Date(asset.warrantyStart).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between text-xs pb-0">
                  <span className="text-muted-foreground font-semibold">Warranty Expiry</span>
                  <span className="text-foreground font-bold">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "activity" && (
          <Card className="rounded-sm border border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-xs font-extrabold uppercase text-primary">Technician Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center justify-center h-32">
              <FileText className="size-6 text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-bold text-muted-foreground font-sans">No recent technician activity notes.</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Technicians can add custom status comments here in a future release.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ==========================================
          MODALS / DIALOGS FOR LIFECYCLE MUTATIONS
          ========================================== */}

      {/* ASSIGN ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Asset"
        description={`Allocate "${asset.name}" to institutional entities.`}
        onSubmit={handleAssignSubmit}
        submitLabel="Assign Asset"
        isSubmitting={assignMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Assignee Type</label>
            <Select value={assigneeType} onValueChange={(v: any) => setAssigneeType(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Student / Faculty / Staff Member</SelectItem>
                <SelectItem value="DEPARTMENT">Department Scope</SelectItem>
                <SelectItem value="LOCATION">Room / Laboratory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assigneeType === "USER" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Institutional User *</label>
              <Select value={assigneeUserId} onValueChange={setAssigneeUserId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Assignee User" /></SelectTrigger>
                <SelectContent>
                  {usersList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assigneeType === "DEPARTMENT" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Institutional Department *</label>
              <Select value={assigneeDeptId} onValueChange={setAssigneeDeptId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Assignee Department" /></SelectTrigger>
                <SelectContent>
                  {departmentsList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assigneeType === "LOCATION" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Specify Laboratory / Room *</label>
              <Input
                value={assigneeLoc}
                onChange={(e) => setAssigneeLoc(e.target.value)}
                placeholder="e.g. Room 304, CS Laboratory"
                className="text-xs h-9 bg-card"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Allocation / Return notes</label>
            <Textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Input details on usage guidelines or setup requirements..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* TRANSFER ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Asset"
        description={`Relocate "${asset.name}" to another entity or department.`}
        onSubmit={handleTransferSubmit}
        submitLabel="Execute Transfer"
        isSubmitting={transferMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Transfer Destination Type</label>
            <Select value={transferType} onValueChange={(v: any) => setTransferType(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Re-allocate to another User</SelectItem>
                <SelectItem value="DEPARTMENT">Re-allocate to another Department</SelectItem>
                <SelectItem value="LOCATION">Re-locate to new Room / Laboratory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {transferType === "USER" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Destination User *</label>
              <Select value={transferUserId} onValueChange={setTransferUserId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Destination User" /></SelectTrigger>
                <SelectContent>
                  {usersList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === "DEPARTMENT" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Destination Department *</label>
              <Select value={transferDeptId} onValueChange={setTransferDeptId}>
                <SelectTrigger className="text-xs h-9 bg-card"><SelectValue placeholder="Select Destination Department" /></SelectTrigger>
                <SelectContent>
                  {departmentsList.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {transferType === "LOCATION" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Location Text Description *</label>
                <Input value={transferLoc} onChange={(e) => setTransferLoc(e.target.value)} placeholder="e.g. Mechanical Lab, Floor 1" className="text-xs h-9 bg-card" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Building</label>
                  <Input value={transferBuilding} onChange={(e) => setTransferBuilding(e.target.value)} placeholder="Building A" className="text-xs h-9 bg-card" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Floor</label>
                  <Input value={transferFloor} onChange={(e) => setTransferFloor(e.target.value)} placeholder="1st Floor" className="text-xs h-9 bg-card" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
                  <Input value={transferRoom} onChange={(e) => setTransferRoom(e.target.value)} placeholder="104" className="text-xs h-9 bg-card" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Transfer Reason / logs</label>
            <Textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Reason for transferring the asset..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* RETURN ASSET DIALOG */}
      <CRUDDialogTemplate
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Return Asset"
        description={`De-allocate "${asset.name}" and return it to availability storage.`}
        onSubmit={handleReturnSubmit}
        submitLabel="De-allocate & Return"
        isSubmitting={returnMutation.isPending}
      >
        <div className="space-y-3 px-1 py-1">
          <p className="text-xs text-muted-foreground">This will close the active assignment record and update the asset stage back to Available.</p>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Return status / logs</label>
            <Textarea
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Enter notes on device condition, return state..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* TRANSITION LIFECYCLE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isLifecycleOpen}
        onClose={() => setIsLifecycleOpen(false)}
        title="Transition Lifecycle Stage"
        description={`Manually update the lifecycle stage for "${asset.name}".`}
        onSubmit={handleLifecycleSubmit}
        submitLabel="Transition Stage"
        isSubmitting={changeLifecycleMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Target Lifecycle Stage</label>
            <Select value={targetStage} onValueChange={(v: any) => setTargetStage(v)}>
              <SelectTrigger className="text-xs h-9 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={LifecycleStage.PROCURED}>Procured</SelectItem>
                <SelectItem value={LifecycleStage.AVAILABLE}>Available</SelectItem>
                <SelectItem value={LifecycleStage.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={LifecycleStage.IN_USE}>In Use</SelectItem>
                <SelectItem value={LifecycleStage.MAINTENANCE}>Maintenance (Placeholder)</SelectItem>
                <SelectItem value={LifecycleStage.RESERVED}>Reserved</SelectItem>
                <SelectItem value={LifecycleStage.RETURNED}>Returned</SelectItem>
                <SelectItem value={LifecycleStage.RETIRED}>Retired</SelectItem>
                <SelectItem value={LifecycleStage.DISPOSED}>Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Lifecycle changes log notes</label>
            <Textarea
              value={lifecycleNotes}
              onChange={(e) => setLifecycleNotes(e.target.value)}
              placeholder="Notes on why stage is changing..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ==========================================
          MODALS / DIALOGS FOR MAINTENANCE OPERATIONS
          ========================================== */}

      {/* SCHEDULE SERVICE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isSchedMaintOpen}
        onClose={() => setIsSchedMaintOpen(false)}
        title="Schedule Service Maintenance"
        description={`Schedule recurring preventive or corrective repair service on "${asset.name}".`}
        onSubmit={handleScheduleMaintSubmit}
        submitLabel="Create Schedule"
        isSubmitting={scheduleMaintMutation.isPending}
      >
        <div className="space-y-3.5 max-h-[70vh] overflow-y-auto px-1 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Type</label>
              <Select value={maintType} onValueChange={setMaintType}>
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
              <Select value={maintPriority} onValueChange={setMaintPriority}>
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
              <Select value={maintTechId} onValueChange={setMaintTechId}>
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
              <Select value={maintRecurrence} onValueChange={setMaintRecurrence}>
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
                value={maintDate}
                onChange={(e) => setMaintDate(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Duration (mins)</label>
              <Input
                type="number"
                value={maintDuration}
                onChange={(e) => setMaintDuration(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Pre-service Notes</label>
            <Textarea
              value={maintNotes}
              onChange={(e) => setMaintNotes(e.target.value)}
              placeholder="Specify initial details of issues or checklist goals..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* ASSIGN TECHNICIAN DIALOG */}
      <CRUDDialogTemplate
        isOpen={isAssignMaintOpen}
        onClose={() => setIsAssignMaintOpen(false)}
        title="Assign Dispatch Technician"
        description="Allocate this maintenance dispatch ticket to an active technician."
        onSubmit={handleAssignMaintSubmit}
        submitLabel="Assign Technician"
        isSubmitting={assignMaintMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Choose Technician *</label>
            <Select value={maintAssignTechId} onValueChange={setMaintAssignTechId}>
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
        isOpen={isCompleteMaintOpen}
        onClose={() => setIsCompleteMaintOpen(false)}
        title="Resolve Maintenance Dispatch"
        description="Input actual service performance metrics and notes to close the record."
        onSubmit={handleCompleteMaintSubmit}
        submitLabel="Resolve & Complete"
        isSubmitting={completeMaintMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Actual Duration (mins) *</label>
              <Input
                type="number"
                value={maintCompleteDuration}
                onChange={(e) => setMaintCompleteDuration(e.target.value)}
                className="text-xs h-9 bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Outcome *</label>
              <Select value={maintCompleteOutcome} onValueChange={setMaintCompleteOutcome}>
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
              value={maintCompleteNotes}
              onChange={(e) => setMaintCompleteNotes(e.target.value)}
              placeholder="Record any actions taken, part changes, or recommendations..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>

      {/* CANCEL MAINTENANCE DIALOG */}
      <CRUDDialogTemplate
        isOpen={isCancelMaintOpen}
        onClose={() => setIsCancelMaintOpen(false)}
        title="Cancel Maintenance Schedule"
        description="Cancel this service record. A valid reason must be logged."
        onSubmit={handleCancelMaintSubmit}
        submitLabel="Cancel Record"
        isSubmitting={cancelMaintMutation.isPending}
      >
        <div className="space-y-3.5 px-1 py-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Cancellation Reason *</label>
            <Textarea
              value={maintCancelReason}
              onChange={(e) => setMaintCancelReason(e.target.value)}
              placeholder="Explain why this maintenance cannot be performed..."
              className="text-xs bg-card"
            />
          </div>
        </div>
      </CRUDDialogTemplate>
    </div>
  );
}
export default AssetDetailPage;
