export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  INSPECTION = "INSPECTION",
  CALIBRATION = "CALIBRATION",
  SOFTWARE_UPDATE = "SOFTWARE_UPDATE",
  HARDWARE_REPAIR = "HARDWARE_REPAIR",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  ASSIGNED = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ARCHIVED = "ARCHIVED",
}

export enum MaintenancePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum MaintenanceRecurrence {
  ONE_TIME = "ONE_TIME",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  HALF_YEARLY = "HALF_YEARLY",
  ANNUAL = "ANNUAL",
}

export enum MaintenanceOutcome {
  SUCCESSFUL = "SUCCESSFUL",
  PARTIALLY_COMPLETED = "PARTIALLY_COMPLETED",
  FAILED = "FAILED",
}

export interface MaintenanceSchedule {
  id: string;
  assetId: string;
  type: MaintenanceType;
  technicianId?: string | null;
  priority: MaintenancePriority;
  recurrence: MaintenanceRecurrence;
  scheduledDate: string | Date;
  estimatedDuration: number;
  notes?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  scheduleId?: string | null;
  type: MaintenanceType;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  technicianId?: string | null;
  scheduledDate: string | Date;
  estimatedDuration: number;
  actualDuration?: number | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  notes?: string | null;
  completionNotes?: string | null;
  cancellationReason?: string | null;
  outcome?: MaintenanceOutcome | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MaintenanceHistory {
  id: string;
  recordId: string;
  status: MaintenanceStatus;
  notes?: string | null;
  performedById: string;
  createdAt: string | Date;
}
