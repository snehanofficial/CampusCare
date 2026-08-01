import { z } from "zod";

export const createSlaPolicySchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100),
  responseTimeLimit: z
    .number()
    .int()
    .min(1, "Response time limit must be at least 1 minute"),
  resolveTimeLimit: z
    .number()
    .int()
    .min(1, "Resolve time limit must be at least 1 minute"),
  escalationRoleName: z
    .string()
    .min(2, "Escalation role name is required")
    .optional()
    .default("DEPT_ADMIN"),
  warningThreshold: z
    .number()
    .int()
    .min(10)
    .max(99)
    .optional()
    .default(80),
  color: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;

export const updateSlaPolicySchema = z.object({
  displayName: z.string().min(3).max(100).optional(),
  responseTimeLimit: z.number().int().min(1).optional(),
  resolveTimeLimit: z.number().int().min(1).optional(),
  escalationRoleName: z.string().min(2).optional(),
  warningThreshold: z.number().int().min(10).max(99).optional(),
  color: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;
