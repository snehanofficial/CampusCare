import { z } from "zod";

// ─── Duration presets (minutes) ────────────────────────────────────────────────
export const DURATION_PRESETS = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
] as const;

export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 1440;

export const APPROVAL_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const APPROVER_ROLES = ["DEPT_ADMIN", "SYSTEM_ADMIN"] as const;

const durationSchema = z
  .number()
  .int("durationMinutes must be a whole number")
  .min(MIN_DURATION_MINUTES, `Duration must be at least ${MIN_DURATION_MINUTES} minutes`)
  .max(MAX_DURATION_MINUTES, `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes`);

const permissionIdsSchema = z
  .array(z.string().uuid("permissionIds must contain valid UUIDs"))
  .min(1, "Select at least one permission")
  .max(50, "Cannot request more than 50 permissions at once");

// ─── Requests ──────────────────────────────────────────────────────────────────
export const createRequestSchema = z.object({
  permissionIds: permissionIdsSchema,
  reason: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(1000, "Justification must be under 1000 characters"),
  durationMinutes: durationSchema,
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const reviewRequestSchema = z.object({
  note: z.string().max(1000, "Note must be under 1000 characters").optional(),
});
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;

export const rejectRequestSchema = z.object({
  note: z
    .string()
    .min(5, "A rejection reason of at least 5 characters is required")
    .max(1000, "Note must be under 1000 characters"),
});
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;

// ─── Direct grant ──────────────────────────────────────────────────────────────
export const grantAccessSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  permissionIds: permissionIdsSchema,
  durationMinutes: durationSchema,
  reason: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(1000, "Justification must be under 1000 characters"),
  templateId: z.string().uuid().optional().nullable(),
});
export type GrantAccessInput = z.infer<typeof grantAccessSchema>;

export const revokeGrantSchema = z.object({
  reason: z
    .string()
    .min(5, "A revocation reason of at least 5 characters is required")
    .max(1000, "Reason must be under 1000 characters"),
});
export type RevokeGrantInput = z.infer<typeof revokeGrantSchema>;

// ─── Templates ─────────────────────────────────────────────────────────────────
export const createTemplateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters").max(100),
  description: z.string().max(500).optional().nullable(),
  defaultDurationMinutes: durationSchema,
  permissionIds: permissionIdsSchema,
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  defaultDurationMinutes: durationSchema.optional(),
  permissionIds: permissionIdsSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// ─── Approval policies ─────────────────────────────────────────────────────────
export const createPolicySchema = z
  .object({
    permissionId: z.string().uuid().optional().nullable(),
    permissionCategory: z.string().min(1).max(100).optional().nullable(),
    approvalLevel: z.enum(APPROVAL_LEVELS),
    approverRole: z.enum(APPROVER_ROLES),
    maxDurationMinutes: durationSchema,
    autoApprove: z.boolean().optional().default(false),
  })
  .refine((v) => Boolean(v.permissionId) !== Boolean(v.permissionCategory), {
    message: "Provide exactly one of permissionId or permissionCategory",
    path: ["permissionId"],
  });
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

export const updatePolicySchema = z.object({
  approvalLevel: z.enum(APPROVAL_LEVELS).optional(),
  approverRole: z.enum(APPROVER_ROLES).optional(),
  maxDurationMinutes: durationSchema.optional(),
  autoApprove: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

// ─── List filters ──────────────────────────────────────────────────────────────
export const listFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
});
export type ListFiltersInput = z.infer<typeof listFiltersSchema>;
