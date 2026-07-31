"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentCreateSchema = exports.ticketCreateSchema = void 0;
const zod_1 = require("zod");
exports.ticketCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, "Title must be at least 5 characters long").max(100),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters long"),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    categoryId: zod_1.z.string().uuid("Invalid category ID"),
    departmentId: zod_1.z.string().uuid("Invalid department ID"),
    assetId: zod_1.z.string().uuid("Invalid asset ID").optional()
});
exports.commentCreateSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "Comment content cannot be empty"),
    isInternal: zod_1.z.boolean().default(false)
});
//# sourceMappingURL=ticket.js.map