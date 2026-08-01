import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdkRequest } from "../../../lib/api-sdk.js";
import { useSocket } from "../../../hooks/useSocket.js";
import { toast } from "sonner";

export type ServiceStatus = "OPERATIONAL" | "DEGRADED" | "DOWN" | "MAINTENANCE";

export interface IncidentData {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MaintenanceWindowData {
  id: string;
  serviceId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
  createdAt: string;
}

export interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: ServiceStatus;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  incidents?: IncidentData[];
  maintenances?: MaintenanceWindowData[];
}

export interface ServiceHistoryData {
  id: string;
  serviceId: string;
  previousStatus: ServiceStatus;
  newStatus: ServiceStatus;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface UptimeHistoryPoint {
  date: string;
  uptime: number;
}

export interface ServiceAvailabilityStats {
  serviceId: string;
  serviceName: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  dailyHistory: UptimeHistoryPoint[];
  hourlyHistory: UptimeHistoryPoint[];
}

// 1. Get all services
export function useServices() {
  return useQuery({
    queryKey: ["service-status", "list"],
    queryFn: () =>
      sdkRequest<ServiceData[]>({
        method: "GET",
        url: "/service-status",
      }),
  });
}

// 2. Get service details
export function useServiceDetails(id: string) {
  return useQuery({
    queryKey: ["service-status", "detail", id],
    queryFn: () =>
      sdkRequest<ServiceData & { histories: ServiceHistoryData[]; maintenanceWindows: MaintenanceWindowData[] }>({
        method: "GET",
        url: `/service-status/${id}`,
      }),
    enabled: !!id,
  });
}

// 3. Get availability statistics
export function useServiceAvailability() {
  return useQuery({
    queryKey: ["service-status", "availability"],
    queryFn: () =>
      sdkRequest<ServiceAvailabilityStats[]>({
        method: "GET",
        url: "/service-status/availability",
      }),
  });
}

// 4. Update service status (admin)
export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; status: ServiceStatus; reason?: string }) =>
      sdkRequest<ServiceData>({
        method: "PATCH",
        url: `/service-status/${variables.id}`,
        data: {
          status: variables.status,
          reason: variables.reason,
        },
      }),
    onSuccess: (data) => {
      toast.success(`Service status updated to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update service status");
    },
  });
}

// 5. Schedule maintenance (admin)
export function useCreateMaintenanceWindow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      serviceId: string;
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
    }) =>
      sdkRequest<MaintenanceWindowData>({
        method: "POST",
        url: `/service-status/${variables.serviceId}/maintenance`,
        data: {
          title: variables.title,
          description: variables.description,
          startTime: variables.startTime,
          endTime: variables.endTime,
        },
      }),
    onSuccess: () => {
      toast.success("Maintenance window scheduled successfully");
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to schedule maintenance window");
    },
  });
}

// 6. Hook to subscribe to real-time events and auto refresh queries
export function useServiceStatusRealtime() {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleServiceStatusUpdated = (data: any) => {
      logger.debug("Socket received service.status.updated event", data);
      toast.info(`Real-time update: ${data.name} is now ${data.newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
    };

    const handleMaintenanceUpdated = (data: any) => {
      logger.debug("Socket received maintenance.updated event", data);
      queryClient.invalidateQueries({ queryKey: ["service-status"] });
    };

    socket.on("service.status.updated", handleServiceStatusUpdated);
    socket.on("maintenance.updated", handleMaintenanceUpdated);

    return () => {
      socket.off("service.status.updated", handleServiceStatusUpdated);
      socket.off("maintenance.updated", handleMaintenanceUpdated);
    };
  }, [socket, queryClient]);

  return { isConnected };
}

// Simple internal logger helper since console.log can be wrapped
const logger = {
  debug: (msg: string, data?: any) => {
    console.debug(`[ServiceStatusRealtime] ${msg}`, data);
  },
};
