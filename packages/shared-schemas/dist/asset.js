"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetCreateSchema = void 0;
const zod_1 = require("zod");
exports.assetCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Asset name must be at least 2 characters long"),
    tag: zod_1.z.string().min(3, "Asset tag must be at least 3 characters long"),
    serialNumber: zod_1.z.string().optional(),
    model: zod_1.z.string().min(1, "Model is required"),
    status: zod_1.z.enum(["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"]),
    location: zod_1.z.string().min(1, "Location is required"),
    departmentId: zod_1.z.string().uuid("Invalid department ID")
});
//# sourceMappingURL=asset.js.map