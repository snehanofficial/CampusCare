import { z } from "zod";

// ─── Set temporary unavailability ──────────────────────────────────────────────
// unavailableUntil is required: this endpoint is specifically for *temporary*
// unavailability (per audit requirement — never conflate with User.isActive).
// A technician who needs indefinite removal should be deactivated by an admin
// via the existing /users endpoint instead.
export const setUnavailabilitySchema = z.object({
  unavailableUntil: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "unavailableUntil must be in the future",
  }),
  reason: z.string().max(300).optional().nullable(),
});

export type SetUnavailabilityInput = z.infer<typeof setUnavailabilitySchema>;
