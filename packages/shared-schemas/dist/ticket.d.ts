import { z } from "zod";
export declare const ticketCreateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    priority: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
    categoryId: z.ZodString;
    departmentId: z.ZodString;
    assetId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    departmentId: string;
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    categoryId: string;
    assetId?: string | undefined;
}, {
    departmentId: string;
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    categoryId: string;
    assetId?: string | undefined;
}>;
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export declare const commentCreateSchema: z.ZodObject<{
    content: z.ZodString;
    isInternal: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    content: string;
    isInternal: boolean;
}, {
    content: string;
    isInternal?: boolean | undefined;
}>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
//# sourceMappingURL=ticket.d.ts.map