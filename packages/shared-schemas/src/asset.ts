import { z } from "zod";

export const assetCreateSchema = z.object({
  name: z.string().min(2, "Asset name must be at least 2 characters long"),
  assetCode: z.string().min(3, "Asset code must be at least 3 characters long").optional(),
  tag: z.string().min(3, "Asset tag must be at least 3 characters long"),
  qrCodeId: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().min(1, "Model is required"),
  manufacturer: z.string().optional().nullable(),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"]).default("OPERATIONAL"),
  lifecycleStage: z.enum(["PROCURED", "AVAILABLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "RESERVED", "RETURNED", "RETIRED", "DISPOSED"]).default("PROCURED"),
  healthStatus: z.enum(["HEALTHY", "MONITOR", "WARNING", "CRITICAL", "FAILING"]).default("HEALTHY"),
  location: z.string().min(1, "Location is required"),
  building: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  
  // Procurement
  purchaseOrderNumber: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  purchasePrice: z.union([z.number(), z.string()]).optional().nullable(),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable(),

  // Warranty
  warrantyStart: z.union([z.string(), z.date()]).optional().nullable(),
  warrantyExpiry: z.union([z.string(), z.date()]).optional().nullable(),
  contractNumber: z.string().optional().nullable(),

  departmentId: z.string().uuid("Invalid department ID"),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable()
});

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;

export const assetCategoryCreateSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters long").max(100),
  description: z.string().optional().nullable()
});

export type AssetCategoryCreateInput = z.infer<typeof assetCategoryCreateSchema>;

export const bulkActionSchema = z.object({
  action: z.enum(["validate", "create", "update", "assign", "transfer", "retire", "qr"]),
  assetIds: z.array(z.string().uuid("Invalid asset ID")).optional(),
  assets: z.array(assetCreateSchema.extend({ id: z.string().uuid().optional() })).optional(),
  payload: z.object({
    departmentId: z.string().uuid().optional(),
    location: z.string().optional(),
    building: z.string().optional(),
    floor: z.string().optional(),
    room: z.string().optional(),
    status: z.enum(["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"]).optional(),
    lifecycleStage: z.enum(["PROCURED", "AVAILABLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "RESERVED", "RETURNED", "RETIRED", "DISPOSED"]).optional(),
    healthStatus: z.enum(["HEALTHY", "MONITOR", "WARNING", "CRITICAL", "FAILING"]).optional(),
    notes: z.string().optional()
  }).optional()
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

// Phase 2 schemas

export const procurementCreateSchema = z.object({
  purchaseOrderNumber: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable(),
  purchaseCost: z.union([z.number(), z.string()]),
  vendorReference: z.string().optional().nullable(),
  status: z.enum(["REQUESTED", "ORDERED", "RECEIVED", "REGISTERED"]).default("REQUESTED"),
  assetName: z.string().min(2, "Asset name must be at least 2 characters long"),
  model: z.string().min(1, "Model is required"),
  manufacturer: z.string().optional().nullable(),
  categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export type ProcurementCreateInput = z.infer<typeof procurementCreateSchema>;

export const assetAssignSchema = z.object({
  assigneeType: z.enum(["USER", "DEPARTMENT", "LOCATION"]),
  userId: z.string().uuid("Invalid user ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export type AssetAssignInput = z.infer<typeof assetAssignSchema>;

export const assetTransferSchema = z.object({
  transferType: z.enum(["USER", "DEPARTMENT", "LOCATION"]),
  userId: z.string().uuid("Invalid user ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  location: z.string().optional().nullable(),
  building: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export type AssetTransferInput = z.infer<typeof assetTransferSchema>;

export const assetLifecycleSchema = z.object({
  lifecycleStage: z.enum(["PROCURED", "AVAILABLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "RESERVED", "RETURNED", "RETIRED", "DISPOSED"]),
  notes: z.string().optional().nullable(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export type AssetLifecycleInput = z.infer<typeof assetLifecycleSchema>;
