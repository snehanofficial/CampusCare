import { z } from "zod";

export const inventoryCategorySchema = z.enum([
  "SPARE_PART",
  "CONSUMABLE",
  "TOOL",
  "CABLE",
  "PERIPHERAL",
  "NETWORKING",
  "STORAGE",
  "POWER",
  "OTHER",
]);

export const inventoryStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "DISCONTINUED",
]);

export const inventoryTransactionTypeSchema = z.enum([
  "STOCK_IN",
  "STOCK_OUT",
  "ADJUSTMENT",
  "TRANSFER",
  "MAINTENANCE_CONSUMPTION",
  "RESERVATION",
  "RESERVATION_RELEASE",
  "SCRAP",
]);

export const allocationStatusSchema = z.enum([
  "PENDING",
  "CONSUMED",
  "RETURNED",
  "CANCELLED",
]);

export const reservationStatusSchema = z.enum([
  "ACTIVE",
  "RELEASED",
  "CONSUMED",
  "EXPIRED",
  "CANCELLED",
]);

export const inventoryItemCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  category: inventoryCategorySchema,
  status: inventoryStatusSchema.default("ACTIVE"),
  unit: z.string().min(1),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  barcodeQr: z.string().optional().nullable(),
  currentStock: z.number().int().min(0).default(0),
  minimumStock: z.number().int().min(0).default(0),
  maximumStock: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  unitCost: z.number().min(0).optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial();

export const stockInSchema = z.object({
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export const stockOutSchema = z.object({
  quantity: z.number().int().positive(),
  reason: z.string().min(3),
  notes: z.string().optional(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export const stockAdjustmentSchema = z.object({
  newQuantity: z.number().int().min(0),
  reason: z.string().min(3),
  clientUpdatedAt: z.string().optional().nullable(),
});

export const maintenanceConsumptionSchema = z.object({
  maintenanceRecordId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export const reserveStockSchema = z.object({
  quantity: z.number().int().positive(),
  moduleRef: z.string().optional(),
  referenceId: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
});

export const releaseReservationSchema = z.object({
  notes: z.string().optional(),
});

export const bulkStockInSchema = z.object({
  items: z.array(z.object({ itemId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  reason: z.string(),
  notes: z.string().optional(),
});

export const bulkStockOutSchema = z.object({
  items: z.array(z.object({ itemId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  reason: z.string(),
  notes: z.string().optional(),
});

export const bulkStockAdjustSchema = z.object({
  items: z.array(z.object({ itemId: z.string().uuid(), newQuantity: z.number().int().min(0) })).min(1),
  reason: z.string(),
  notes: z.string().optional(),
});

export const bulkSoftDeleteSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
  category: inventoryCategorySchema.optional(),
  status: inventoryStatusSchema.optional(),
  isLowStock: z.coerce.boolean().optional(),
  isCriticalStock: z.coerce.boolean().optional(),
  isOutOfStock: z.coerce.boolean().optional(),
  location: z.string().optional(),
  barcodeQr: z.string().optional(),
});

export const inventoryTransactionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(10),
  itemId: z.string().uuid().optional(),
  transactionType: inventoryTransactionTypeSchema.optional(),
  performedById: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const inventoryBulkImportRowSchema = z.object({
  name: z.string().min(2),
  category: z.string(),
  unit: z.string().min(1),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  barcodeQr: z.string().optional(),
  currentStock: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  maximumStock: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  unitCost: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

