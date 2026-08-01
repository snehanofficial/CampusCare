import { z } from "zod";

export const maintenanceTypeSchema = z.enum([
  "PREVENTIVE",
  "CORRECTIVE",
  "INSPECTION",
  "CALIBRATION",
  "SOFTWARE_UPDATE",
  "HARDWARE_REPAIR",
]);

export const maintenanceStatusSchema = z.enum([
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export const maintenancePrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const maintenanceRecurrenceSchema = z.enum([
  "ONE_TIME",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "ANNUAL",
]);

export const maintenanceOutcomeSchema = z.enum([
  "SUCCESSFUL",
  "PARTIALLY_COMPLETED",
  "FAILED",
]);

export const maintenanceScheduleCreateSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  type: maintenanceTypeSchema,
  technicianId: z.string().uuid("Invalid technician ID").optional().nullable(),
  priority: maintenancePrioritySchema,
  recurrence: maintenanceRecurrenceSchema,
  scheduledDate: z.union([z.string(), z.date()]),
  estimatedDuration: z.number().int().positive("Estimated duration must be positive (in minutes)"),
  notes: z.string().optional().nullable(),
});

export type MaintenanceScheduleCreateInput = z.infer<typeof maintenanceScheduleCreateSchema>;

export const maintenanceRecordCreateSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID"),
  scheduleId: z.string().uuid("Invalid schedule ID").optional().nullable(),
  type: maintenanceTypeSchema,
  priority: maintenancePrioritySchema,
  technicianId: z.string().uuid("Invalid technician ID").optional().nullable(),
  scheduledDate: z.union([z.string(), z.date()]),
  estimatedDuration: z.number().int().positive("Estimated duration must be positive (in minutes)"),
  notes: z.string().optional().nullable(),
});

export type MaintenanceRecordCreateInput = z.infer<typeof maintenanceRecordCreateSchema>;

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid("Invalid technician ID").nullable().optional(),
  clientUpdatedAt: z.string().optional().nullable(),
});

export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;

export const completeMaintenanceSchema = z.object({
  actualDuration: z.number().int().positive("Actual duration must be positive (in minutes)"),
  completionNotes: z.string().optional().nullable(),
  outcome: maintenanceOutcomeSchema,
  clientUpdatedAt: z.string().optional().nullable(),
});

export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

export const cancelMaintenanceSchema = z.object({
  cancellationReason: z.string().min(3, "Cancellation reason must be at least 3 characters long"),
  clientUpdatedAt: z.string().optional().nullable(),
});

export type CancelMaintenanceInput = z.infer<typeof cancelMaintenanceSchema>;

export const bulkScheduleSchema = z.object({
  assetIds: z.array(z.string().uuid("Invalid asset ID")).min(1, "At least one asset must be selected"),
  type: maintenanceTypeSchema,
  technicianId: z.string().uuid("Invalid technician ID").optional().nullable(),
  priority: maintenancePrioritySchema,
  recurrence: maintenanceRecurrenceSchema,
  scheduledDate: z.union([z.string(), z.date()]),
  estimatedDuration: z.number().int().positive("Estimated duration must be positive (in minutes)"),
  notes: z.string().optional().nullable(),
});

export type BulkScheduleInput = z.infer<typeof bulkScheduleSchema>;

export const bulkAssignTechnicianSchema = z.object({
  recordIds: z.array(z.string().uuid("Invalid record ID")).min(1, "At least one record must be selected"),
  technicianId: z.string().uuid("Invalid technician ID").nullable().optional(),
});

export type BulkAssignTechnicianInput = z.infer<typeof bulkAssignTechnicianSchema>;

