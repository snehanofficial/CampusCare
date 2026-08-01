import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .max(10, "Department code must not exceed 10 characters")
    .toUpperCase(),
  description: z.string().max(255).optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100).optional(),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .max(10, "Department code must not exceed 10 characters")
    .toUpperCase()
    .optional(),
  description: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
