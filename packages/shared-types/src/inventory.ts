export enum InventoryCategory {
  SPARE_PART = "SPARE_PART",
  CONSUMABLE = "CONSUMABLE",
  TOOL = "TOOL",
  CABLE = "CABLE",
  PERIPHERAL = "PERIPHERAL",
  NETWORKING = "NETWORKING",
  STORAGE = "STORAGE",
  POWER = "POWER",
  OTHER = "OTHER",
}

export enum InventoryStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DISCONTINUED = "DISCONTINUED",
}

export enum InventoryTransactionType {
  STOCK_IN = "STOCK_IN",
  STOCK_OUT = "STOCK_OUT",
  ADJUSTMENT = "ADJUSTMENT",
  TRANSFER = "TRANSFER",
  MAINTENANCE_CONSUMPTION = "MAINTENANCE_CONSUMPTION",
  RESERVATION = "RESERVATION",
  RESERVATION_RELEASE = "RESERVATION_RELEASE",
  SCRAP = "SCRAP",
}

export enum AllocationStatus {
  PENDING = "PENDING",
  CONSUMED = "CONSUMED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export enum ReservationStatus {
  ACTIVE = "ACTIVE",
  RELEASED = "RELEASED",
  CONSUMED = "CONSUMED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  description?: string | null;
  category: InventoryCategory;
  status: InventoryStatus;
  unit: string;
  manufacturer?: string | null;
  model?: string | null;
  barcodeQr?: string | null;
  currentStock: number;
  reservedStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unitCost?: string | number | null;
  location?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InventoryItemWithAvailable extends InventoryItem {
  availableStock: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string | null;
  referenceType?: string | null;
  reason?: string | null;
  notes?: string | null;
  performedById: string;
  createdAt: string | Date;
}

export interface InventoryAllocation {
  id: string;
  itemId: string;
  maintenanceRecordId: string;
  quantityRequested: number;
  quantityConsumed: number;
  status: AllocationStatus;
  notes?: string | null;
  allocatedById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InventoryReservation {
  id: string;
  itemId: string;
  quantity: number;
  status: ReservationStatus;
  requestedBy: string;
  moduleRef?: string | null;
  referenceId?: string | null;
  notes?: string | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InventoryDashboardSummary {
  totalItems: number;
  activeItems: number;
  lowStockItems: number;
  criticalStockItems: number;
  outOfStockItems: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalInventoryValue?: number | null;
  recentTransactions: InventoryTransaction[];
}

export interface InventoryBulkImportRow {
  name: string;
  category: string;
  unit: string;
  manufacturer?: string;
  model?: string;
  barcodeQr?: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderLevel: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export interface InventoryBulkImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export interface InventoryListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  category?: InventoryCategory;
  status?: InventoryStatus;
  isLowStock?: boolean;
  isCriticalStock?: boolean;
  isOutOfStock?: boolean;
  location?: string;
  barcodeQr?: string;
}

export interface InventoryTransactionListQuery {
  page?: number;
  pageSize?: number;
  itemId?: string;
  transactionType?: InventoryTransactionType;
  performedById?: string;
  fromDate?: string;
  toDate?: string;
  sortOrder?: "asc" | "desc";
}

export interface BulkStockOperationItem {
  itemId: string;
  quantity?: number;
  newQuantity?: number;
}

export interface BulkStockOperationPayload {
  items: BulkStockOperationItem[];
  reason: string;
  notes?: string;
}

export interface BulkStockOperationResult {
  succeeded: Array<{ itemId: string; newStock: number }>;
  failed: Array<{ itemId: string; reason: string }>;
}

export interface BulkSoftDeletePayload {
  itemIds: string[];
}

export interface BulkSoftDeleteResult {
  succeeded: string[];
  failed: Array<{ itemId: string; reason: string }>;
}

