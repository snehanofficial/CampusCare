import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().max(255).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100).optional(),
  description: z.string().max(255).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
