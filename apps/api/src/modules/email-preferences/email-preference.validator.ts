import { z } from "zod";

export const emailPreferenceUpdateSchema = z.object({
  preferences: z.array(
    z.object({
      eventType: z.string().min(1, "eventType is required"),
      enabled: z.boolean()
    })
  )
});

export type EmailPreferenceUpdateInput = z.infer<typeof emailPreferenceUpdateSchema>;
export default emailPreferenceUpdateSchema;
