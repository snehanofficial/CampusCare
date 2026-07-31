import { z } from "zod";

export const assetCreateSchema = z.object({
  name: z.string().min(2, "Asset name must be at least 2 characters long"),
  tag: z.string().min(3, "Asset tag must be at least 3 characters long"),
  serialNumber: z.string().optional(),
  model: z.string().min(1, "Model is required"),
  status: z.enum(["OPERATIONAL", "MAINTENANCE", "DECOMMISSIONED", "BROKEN"]),
  location: z.string().min(1, "Location is required"),
  departmentId: z.string().uuid("Invalid department ID")
});

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
