import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  roleId: z.string().uuid("Invalid Role ID"),
  departmentId: z.string().uuid("Invalid Department ID").nullable().optional(),
  phone: z.string().max(20).optional().nullable(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  roleId: z.string().uuid("Invalid Role ID").optional(),
  departmentId: z.string().uuid("Invalid Department ID").nullable().optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
