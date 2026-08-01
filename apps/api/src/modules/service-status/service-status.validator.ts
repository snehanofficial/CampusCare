import { z } from "zod";

export const serviceStatusUpdateSchema = z.object({
  status: z.enum(["OPERATIONAL", "DEGRADED", "DOWN", "MAINTENANCE"]),
  reason: z.string().max(255, "Reason must be less than 255 characters").optional(),
});

export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;

export const maintenanceCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  startTime: z.string().datetime({ message: "Start time must be a valid ISO datetime" }),
  endTime: z.string().datetime({ message: "End time must be a valid ISO datetime" }),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end.getTime() > start.getTime();
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export type MaintenanceCreateInput = z.infer<typeof maintenanceCreateSchema>;
