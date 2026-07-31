import { z } from "zod";

export const ticketCreateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long").max(100),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  categoryId: z.string().uuid("Invalid category ID"),
  departmentId: z.string().uuid("Invalid department ID"),
  assetId: z.string().uuid("Invalid asset ID").optional()
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  isInternal: z.boolean().default(false)
});

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
