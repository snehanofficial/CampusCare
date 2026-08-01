export enum AssetStatus {
  OPERATIONAL = "OPERATIONAL",
  MAINTENANCE = "MAINTENANCE",
  DECOMMISSIONED = "DECOMMISSIONED",
  BROKEN = "BROKEN",
}

export enum LifecycleStage {
  PROCURED = "PROCURED",
  AVAILABLE = "AVAILABLE",
  ASSIGNED = "ASSIGNED",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED",
  RETURNED = "RETURNED",
  RETIRED = "RETIRED",
  DISPOSED = "DISPOSED",
}

export enum HealthStatus {
  HEALTHY = "HEALTHY",
  MONITOR = "MONITOR",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  FAILING = "FAILING",
}

export enum ProcurementStatus {
  REQUESTED = "REQUESTED",
  ORDERED = "ORDERED",
  RECEIVED = "RECEIVED",
  REGISTERED = "REGISTERED",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  RETURNED = "RETURNED",
  TRANSFERRED = "TRANSFERRED",
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Asset {
  id: string;
  name: string;
  assetCode: string;
  tag: string; // QR Code identifier
  qrCodeId?: string | null;
  serialNumber?: string | null;
  model: string;
  manufacturer?: string | null;
  status: AssetStatus;
  lifecycleStage: LifecycleStage;
  healthStatus: HealthStatus;
  location: string;
  building?: string | null;
  floor?: string | null;
  room?: string | null;

  // Procurement
  purchaseOrderNumber?: string | null;
  vendorId?: string | null;
  purchasePrice?: number | string | null;
  purchaseDate?: string | Date | null;

  // Warranty / AMC
  warrantyStart?: string | Date | null;
  warrantyExpiry?: string | Date | null;
  contractNumber?: string | null;

  departmentId: string;
  categoryId?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  actionType: string; // e.g. "CREATED", "MAINTENANCE", "STATUS_CHANGE", "ASSIGNED", "RETIRED"
  notes: string;
  performedById: string;
  createdAt: string | Date;
}

export interface Procurement {
  id: string;
  requestNumber: string;
  purchaseOrderNumber?: string | null;
  invoiceNumber?: string | null;
  purchaseDate?: string | Date | null;
  purchaseCost: number | string;
  vendorReference?: string | null;
  status: ProcurementStatus;
  assetName: string;
  model: string;
  manufacturer?: string | null;
  categoryId?: string | null;
  departmentId: string;
  quantity: number;
  registeredCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  assigneeType: string; // "USER" | "DEPARTMENT" | "LOCATION"
  userId?: string | null;
  departmentId?: string | null;
  location?: string | null;
  assignedAt: string | Date;
  returnedAt?: string | Date | null;
  status: AssignmentStatus;
  assignedById: string;
  notes?: string | null;
}
