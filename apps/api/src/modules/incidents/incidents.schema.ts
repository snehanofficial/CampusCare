import { z } from "zod";

// ─── Create Incident ───────────────────────────────────────────────────────────
export const createIncidentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),

  status: z
    .enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const)
    .optional()
    .default("OPEN"),

  rootCause: z.string().max(500).optional().nullable(),

  ticketIds: z.array(z.string().uuid()).optional().default([]),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// ─── Update Incident ───────────────────────────────────────────────────────────
export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(10).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).optional(),
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const).optional(),
  rootCause: z.string().max(500).optional().nullable(),
  ticketIds: z.array(z.string().uuid()).optional(),
});

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
