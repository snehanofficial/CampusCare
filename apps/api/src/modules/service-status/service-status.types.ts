export type ServiceStatus = "OPERATIONAL" | "DEGRADED" | "DOWN" | "MAINTENANCE";

export interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: ServiceStatus;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceStatusHistoryData {
  id: string;
  serviceId: string;
  previousStatus: ServiceStatus;
  newStatus: ServiceStatus;
  reason: string | null;
  changedBy: string | null;
  createdAt: Date;
}

export interface MaintenanceWindowData {
  id: string;
  serviceId: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED";
  createdAt: Date;
}

export interface UptimeHistoryPoint {
  date: string; // ISO date string (YYYY-MM-DD) or time label
  uptime: number; // percentage
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
