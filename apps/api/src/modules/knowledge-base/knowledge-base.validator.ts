import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  summary: z.string().min(5, "Summary must be at least 5 characters").max(500),
  categoryId: z.string().uuid("Invalid category ID"),
  tags: z.array(z.string().min(1)).max(20, "Maximum 20 tags allowed").default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const updateArticleSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  summary: z.string().min(5).max(500).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const publishArticleSchema = z.object({}).strict(); // empty body, publish action is in route

export const feedbackSchema = z.object({
  helpful: z.boolean(),
  comment: z.string().max(1000).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type FeedbackSchemaInput = z.infer<typeof feedbackSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
