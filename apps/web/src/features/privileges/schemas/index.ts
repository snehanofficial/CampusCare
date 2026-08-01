import { z } from "zod";

/**
 * Client-side mirrors of the API's Zod contracts (`privileges.schema.ts`).
 * Validation runs on both ends — these give instant form feedback, the server
 * remains the authority.
 */

export const DURATION_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "8 hours", minutes: 480 },
  { label: "1 day", minutes: 1440 },
] as const;

export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 1440;

const durationSchema = z
  .number()
  .int("Duration must be a whole number of minutes")
  .min(MIN_DURATION_MINUTES, `Duration must be at least ${MIN_DURATION_MINUTES} minutes`)
  .max(MAX_DURATION_MINUTES, `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes`);

const permissionIdsSchema = z
  .array(z.string().uuid())
  .min(1, "Select at least one permission")
  .max(50, "Cannot select more than 50 permissions at once");

export const requestFormSchema = z.object({
  permissionIds: permissionIdsSchema,
  reason: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(1000, "Justification must be under 1000 characters"),
  durationMinutes: durationSchema,
});
export type RequestFormValues = z.infer<typeof requestFormSchema>;

export const grantFormSchema = z.object({
  userId: z.string().uuid("Select a user"),
  permissionIds: permissionIdsSchema,
  durationMinutes: durationSchema,
  reason: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(1000, "Justification must be under 1000 characters"),
  templateId: z.string().uuid().nullable().optional(),
});
export type GrantFormValues = z.infer<typeof grantFormSchema>;

export const revokeFormSchema = z.object({
  reason: z
    .string()
    .min(5, "A revocation reason of at least 5 characters is required")
    .max(1000),
});
export type RevokeFormValues = z.infer<typeof revokeFormSchema>;

export const rejectFormSchema = z.object({
  note: z
    .string()
    .min(5, "A rejection reason of at least 5 characters is required")
    .max(1000),
});
export type RejectFormValues = z.infer<typeof rejectFormSchema>;
