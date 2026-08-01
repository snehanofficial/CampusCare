import { z } from "zod";

// ─── Condition ─────────────────────────────────────────────────────────────────
// Each condition: { field, operator, value }
// Supported fields: priority, status, categoryId, departmentId, assigneeId, creatorId
// Operators: eq, neq, in, not_in, is_null, is_not_null
const conditionSchema = z.object({
  field: z.enum([
    "priority",
    "status",
    "categoryId",
    "departmentId",
    "assigneeId",
    "creatorId",
  ] as const),
  operator: z.enum(["eq", "neq", "in", "not_in", "is_null", "is_not_null"] as const),
  value: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
});

export type RuleCondition = z.infer<typeof conditionSchema>;

// ─── Action ────────────────────────────────────────────────────────────────────
// Each action: { type, value? }
// ASSIGN_TO          → value = userId (UUID)
// SET_PRIORITY       → value = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
// SET_STATUS         → value = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED"
// ADD_COMMENT        → value = comment text
// SET_DEPARTMENT     → value = departmentId (UUID)
const actionSchema = z.object({
  type: z.enum([
    "ASSIGN_TO",
    "SET_PRIORITY",
    "SET_STATUS",
    "ADD_COMMENT",
    "SET_DEPARTMENT",
  ] as const),
  value: z.string().optional(),
});

export type RuleAction = z.infer<typeof actionSchema>;

// ─── Create Rule ───────────────────────────────────────────────────────────────
export const createRuleSchema = z.object({
  name: z
    .string()
    .min(3, "Rule name must be at least 3 characters")
    .max(100, "Rule name must be under 100 characters"),

  description: z.string().max(255).optional().nullable(),

  isActive: z.boolean().optional().default(true),

  priority: z.number().int().min(0).max(9999).optional().default(0),

  trigger: z.enum(["ON_CREATE", "ON_UPDATE", "ON_STATUS_CHANGE"] as const),

  conditions: z
    .array(conditionSchema)
    .min(1, "At least one condition is required"),

  actions: z
    .array(actionSchema)
    .min(1, "At least one action is required"),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;

// ─── Update Rule ───────────────────────────────────────────────────────────────
export const updateRuleSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  trigger: z.enum(["ON_CREATE", "ON_UPDATE", "ON_STATUS_CHANGE"] as const).optional(),
  conditions: z.array(conditionSchema).min(1).optional(),
  actions: z.array(actionSchema).min(1).optional(),
});

export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
