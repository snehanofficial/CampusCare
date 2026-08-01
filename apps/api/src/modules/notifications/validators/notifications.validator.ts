import { z } from "zod";

export const updatePreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      category: z.enum(["TICKET", "INCIDENT", "ASSET", "MAINTENANCE", "INVENTORY", "SLA", "SYSTEM"]),
      email: z.boolean(),
      inApp: z.boolean(),
      push: z.boolean(),
    })
  ),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  message: z.string().min(1, "Message is required").max(500),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]).default("INFO"),
  category: z.enum(["TICKET", "INCIDENT", "ASSET", "MAINTENANCE", "INVENTORY", "SLA", "SYSTEM"]).default("SYSTEM"),
  referenceId: z.string().optional(),
  actionUrl: z.string().optional(),
  sendEmail: z.boolean().optional(),
  audience: z.enum(["ALL_USERS", "STUDENTS", "FACULTY", "TECHNICIANS", "DEPARTMENT_ADMIN", "CUSTOM_USERS"]).optional(),
  customUserIds: z.array(z.string()).optional(),
});
