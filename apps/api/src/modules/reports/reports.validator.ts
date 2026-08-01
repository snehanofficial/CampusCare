import { z } from "zod";

// Report filter shared schema
const reportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  buildingId: z.string().optional(),
});

export const generateReportSchema = z.object({
  type: z.enum([
    "TICKET_REPORT",
    "ASSET_REPORT",
    "INVENTORY_REPORT",
    "MAINTENANCE_REPORT",
    "SLA_REPORT",
    "INCIDENT_REPORT",
  ]),
  filters: reportFiltersSchema.optional(),
});

export const exportReportSchema = z.object({
  type: z.enum([
    "TICKET_REPORT",
    "ASSET_REPORT",
    "INVENTORY_REPORT",
    "MAINTENANCE_REPORT",
    "SLA_REPORT",
    "INCIDENT_REPORT",
  ]),
  format: z.enum(["PDF", "EXCEL", "CSV"]),
  filters: reportFiltersSchema.optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
