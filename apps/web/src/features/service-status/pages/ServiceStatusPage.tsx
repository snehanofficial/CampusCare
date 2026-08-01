import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wrench,
  Activity,
  AlertTriangle,
  Clock,
  History,
  Calendar,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { Input } from "../../../components/ui/input.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog.js";
import { usePermission } from "../../../hooks/usePermission.js";
import { LoadingSpinner } from "../../../components/ui/loading-spinner.js";
import { IncidentBanner } from "../components/IncidentBanner.js";
import { ServiceCard } from "../components/ServiceCard.js";
import { MaintenanceCard } from "../components/MaintenanceCard.js";
import { AvailabilityChart } from "../components/AvailabilityChart.js";
import {
  useServices,
  useServiceAvailability,
  useUpdateServiceStatus,
  useCreateMaintenanceWindow,
  useServiceStatusRealtime,
  ServiceStatus,
} from "../hooks/useServiceStatus.js";

// Validation schemas for React Hook Form
const statusFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  status: z.enum(["OPERATIONAL", "DEGRADED", "DOWN", "MAINTENANCE"]),
  reason: z.string().max(255, "Reason must be under 255 characters").optional(),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

const maintenanceFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end.getTime() > start.getTime();
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export function ServiceStatusPage() {
  const { hasPermission } = usePermission();
  const isAdmin = hasPermission("service_status.manage");

  // Fetch queries
  const { data: services, isLoading: servicesLoading, error: servicesError, refetch: refetchServices } = useServices();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useServiceAvailability();

  // Mutations
  const updateStatusMutation = useUpdateServiceStatus();
  const createMaintenanceMutation = useCreateMaintenanceWindow();

  // Socket connection and real-time subscription
  const { isConnected } = useServiceStatusRealtime();

  // Local dialog UI states
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

  // Forms setup
  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      serviceId: "",
      status: "OPERATIONAL",
      reason: "",
    },
  });

  const maintenanceForm = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      serviceId: "",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
    },
  });

  // Action handlers
  const handleUpdateStatusSubmit = async (values: StatusFormValues) => {
    await updateStatusMutation.mutateAsync({
      id: values.serviceId,
      status: values.status,
      reason: values.reason,
    });
    setIsStatusOpen(false);
    statusForm.reset();
  };

  const handleCreateMaintenanceSubmit = async (values: MaintenanceFormValues) => {
    // Convert to ISO string for backend
    const startIso = new Date(values.startTime).toISOString();
    const endIso = new Date(values.endTime).toISOString();

    await createMaintenanceMutation.mutateAsync({
      serviceId: values.serviceId,
      title: values.title,
      description: values.description,
      startTime: startIso,
      endTime: endIso,
    });
    setIsMaintenanceOpen(false);
    maintenanceForm.reset();
  };

  const handleManualRefresh = () => {
    refetchServices();
    refetchStats();
  };

  if (servicesLoading || statsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="size-6 text-primary" />
      </div>
    );
  }

  if (servicesError || statsError || !services || !stats) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Failed to load campus service status dashboard.</p>
        <Button onClick={handleManualRefresh} className="mt-4" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Flatten and sort history logs from all services to show in the history panel
  const globalHistories = services
    .flatMap((s) => (s.incidents || []).map((inc) => ({
      id: inc.id,
      serviceName: s.name,
      type: "Incident",
      title: inc.title,
      details: inc.status,
      date: new Date(inc.createdAt),
      color: "text-destructive",
    })))
    .concat(
      services.flatMap((s) => (s.maintenances || []).map((mw) => ({
        id: mw.id,
        serviceName: s.name,
        type: "Maintenance",
        title: mw.title,
        details: mw.status,
        date: new Date(mw.startTime),
        color: "text-info",
      })))
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  const allMaintenances = services.flatMap((s) => s.maintenances || []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/20 pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Campus Systems Health Page</h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Real-time status updates and availability checks for central university digital services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-muted px-2.5 py-1 rounded">
            <span className={`size-1.5 rounded-full ${isConnected ? "bg-success" : "bg-warning"}`} />
            {isConnected ? "Live Sync Enabled" : "Sync Offline"}
          </span>
          <Button variant="outline" size="sm" className="h-8 text-xs cursor-pointer" onClick={handleManualRefresh}>
            <RefreshCw className="size-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Outage Summary Alert Bar */}
      <IncidentBanner services={services} />

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column (Services Registry and Analytics) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                availabilityStats={stats.find((st) => st.serviceId === service.id)}
                isAdmin={isAdmin}
                onSelect={() => {
                  statusForm.setValue("serviceId", service.id);
                  statusForm.setValue("status", service.status);
                  setIsStatusOpen(true);
                }}
              />
            ))}
          </div>

          <AvailabilityChart stats={stats} />
        </div>

        {/* Right Column (Sidebar - Maintenance & Admin Panels) */}
        <div className="space-y-6">
          <MaintenanceCard maintenances={allMaintenances} services={services} />

          {/* Admin Tools Panel */}
          {isAdmin ? (
            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-primary/10">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    SysOps Controls
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                  Select a service from the list or use the actions below to override health and schedule downtime.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs cursor-pointer w-full flex items-center justify-center gap-1.5"
                    onClick={() => {
                      statusForm.reset();
                      setIsStatusOpen(true);
                    }}
                  >
                    <Activity className="size-3.5" />
                    Manually Update Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs cursor-pointer w-full flex items-center justify-center gap-1.5"
                    onClick={() => {
                      maintenanceForm.reset();
                      setIsMaintenanceOpen(true);
                    }}
                  >
                    <Calendar className="size-3.5 text-primary" />
                    Schedule Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/40 bg-card p-4 flex items-center gap-3">
              <Lock className="size-4 text-muted-foreground" />
              <div className="text-xs">
                <p className="font-bold text-foreground">Restricted Workspace</p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Authentication requires service_status.manage permission to edit.
                </p>
              </div>
            </Card>
          )}

          {/* Activity Logs Panel */}
          <Card className="border border-border/40 bg-card">
            <CardHeader className="py-3 px-4 border-b border-border/20">
              <div className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recent Events Log
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/20 text-xs">
              {globalHistories.length === 0 ? (
                <p className="p-6 text-center text-[10.5px] text-muted-foreground font-semibold">
                  No recent status change histories recorded.
                </p>
              ) : (
                globalHistories.map((hist) => (
                  <div key={hist.id} className="p-3 space-y-1 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-foreground truncate w-2/3">
                        {hist.serviceName}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {hist.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {hist.type === "Incident" ? `Incident: ${hist.title}` : `Maintenance: ${hist.title}`}
                    </p>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      Status: {hist.details}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog 1: Update Service Status Modal */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update System Status</DialogTitle>
            <DialogDescription>
              Force override the service status and post a reason message to users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={statusForm.handleSubmit(handleUpdateStatusSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Select Service
              </label>
              <select
                {...statusForm.register("serviceId")}
                className="w-full text-xs font-medium border border-border/40 rounded p-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="" disabled>-- Choose Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Current: {s.status})
                  </option>
                ))}
              </select>
              {statusForm.formState.errors.serviceId && (
                <p className="text-[10px] text-destructive font-bold">
                  {statusForm.formState.errors.serviceId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                New Health Status
              </label>
              <select
                {...statusForm.register("status")}
                className="w-full text-xs font-medium border border-border/40 rounded p-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="DEGRADED">DEGRADED</option>
                <option value="DOWN">DOWN</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Status Update Notes / Reason
              </label>
              <Textarea
                {...statusForm.register("reason")}
                placeholder="Describe the issue or restore updates..."
                className="text-xs min-h-20"
              />
              {statusForm.formState.errors.reason && (
                <p className="text-[10px] text-destructive font-bold">
                  {statusForm.formState.errors.reason.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={() => setIsStatusOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Updating..." : "Post Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog 2: Schedule Maintenance Modal */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Maintenance Window</DialogTitle>
            <DialogDescription>
              Announce a future maintenance slot. If scheduled immediately, the service will switch status automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={maintenanceForm.handleSubmit(handleCreateMaintenanceSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Select Affected Service
              </label>
              <select
                {...maintenanceForm.register("serviceId")}
                className="w-full text-xs font-medium border border-border/40 rounded p-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="" disabled>-- Choose Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {maintenanceForm.formState.errors.serviceId && (
                <p className="text-[10px] text-destructive font-bold">
                  {maintenanceForm.formState.errors.serviceId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Maintenance Title
              </label>
              <Input
                {...maintenanceForm.register("title")}
                placeholder="e.g., Core database migrations"
                className="text-xs h-8"
              />
              {maintenanceForm.formState.errors.title && (
                <p className="text-[10px] text-destructive font-bold">
                  {maintenanceForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                Scope Description
              </label>
              <Textarea
                {...maintenanceForm.register("description")}
                placeholder="Provide outage timeline details or recovery estimates..."
                className="text-xs min-h-16"
              />
              {maintenanceForm.formState.errors.description && (
                <p className="text-[10px] text-destructive font-bold">
                  {maintenanceForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  Start Date/Time
                </label>
                <Input
                  type="datetime-local"
                  {...maintenanceForm.register("startTime")}
                  className="text-xs h-8"
                />
                {maintenanceForm.formState.errors.startTime && (
                  <p className="text-[10px] text-destructive font-bold">
                    {maintenanceForm.formState.errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                  End Date/Time
                </label>
                <Input
                  type="datetime-local"
                  {...maintenanceForm.register("endTime")}
                  className="text-xs h-8"
                />
                {maintenanceForm.formState.errors.endTime && (
                  <p className="text-[10px] text-destructive font-bold">
                    {maintenanceForm.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={() => setIsMaintenanceOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                disabled={createMaintenanceMutation.isPending}
              >
                {createMaintenanceMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ServiceStatusPage;
