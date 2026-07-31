import { z } from "zod";
export declare const assetCreateSchema: z.ZodObject<{
    name: z.ZodString;
    tag: z.ZodString;
    serialNumber: z.ZodOptional<z.ZodString>;
    model: z.ZodString;
    status: z.ZodEnum<["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"]>;
    location: z.ZodString;
    departmentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    tag: string;
    model: string;
    status: "OPERATIONAL" | "MAINTENANCE" | "DECOMMISSIONED" | "BROKEN";
    location: string;
    departmentId: string;
    serialNumber?: string | undefined;
}, {
    name: string;
    tag: string;
    model: string;
    status: "OPERATIONAL" | "MAINTENANCE" | "DECOMMISSIONED" | "BROKEN";
    location: string;
    departmentId: string;
    serialNumber?: string | undefined;
}>;
export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
//# sourceMappingURL=asset.d.ts.map