import { z } from "zod";

// ─── Create Ticket ─────────────────────────────────────────────────────────────
export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),

  categoryId: z.string().uuid("categoryId must be a valid UUID"),

  departmentId: z.string().uuid("departmentId must be a valid UUID"),

  assetId: z.string().uuid("assetId must be a valid UUID").optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

// ─── Update Ticket ─────────────────────────────────────────────────────────────
export const updateTicketSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(10).optional(),
  status: z
    .enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"] as const)
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  assetId: z.string().uuid().nullable().optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

// ─── Comments ──────────────────────────────────────────────────────────────────
export const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
  isInternal: z.boolean().optional().default(false),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const reopenTicketSchema = z.object({
  reason: z.string().min(5, "Reopen reason must be at least 5 characters"),
});

export type ReopenTicketInput = z.infer<typeof reopenTicketSchema>;

