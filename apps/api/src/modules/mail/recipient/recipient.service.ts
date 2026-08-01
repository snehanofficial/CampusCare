import { RecipientResolver } from "./recipient.resolver.js";
import { EmailPreferenceService } from "../../email-preferences/email-preference.service.js";
import { logger } from "../../../utils/logger.js";
import type { ResolvedRecipient, AudienceType } from "./recipient.types.js";

export class RecipientService {
  /**
   * Resolves the active user recipients for a notification event,
   * checking preferences to filter out those who have opted out.
   */
  static async resolveAndFilterOptedIn(params: {
    userId?: string;
    category: string;
    title: string;
    referenceId?: string;
  }): Promise<ResolvedRecipient[]> {
    // 1. Resolve recipients based on category/reference
    const resolved = await RecipientResolver.resolve(params);
    if (resolved.length === 0) return [];

    const optedIn: ResolvedRecipient[] = [];

    // 2. Filter list by evaluating user preferences
    for (const rec of resolved) {
      try {
        const isEnabled = await EmailPreferenceService.isEmailEnabledForNotification({
          userId: rec.userId,
          category: params.category,
          title: params.title,
        });

        if (isEnabled) {
          optedIn.push(rec);
        } else {
          logger.info(
            { userId: rec.userId, category: params.category },
            "[RecipientService] User opted out of emails for this event type. Skipping."
          );
        }
      } catch (err) {
        logger.error(err, `[RecipientService] Error checking preference for user ${rec.userId}`);
        // Fallback: default to send if error happens
        optedIn.push(rec);
      }
    }

    return optedIn;
  }

  /**
   * Resolves active broadcast audience users and filters by their SYSTEM_ANNOUNCEMENT preference settings.
   */
  static async resolveAndFilterAudience(
    audience: AudienceType,
    customUserIds?: string[]
  ): Promise<ResolvedRecipient[]> {
    const resolved = await RecipientResolver.resolveAudience(audience, customUserIds);
    if (resolved.length === 0) return [];

    const optedIn: ResolvedRecipient[] = [];

    for (const rec of resolved) {
      try {
        const isEnabled = await EmailPreferenceService.isEmailEnabledForNotification({
          userId: rec.userId,
          category: "SYSTEM",
          title: "Broadcast Announcement",
        });

        if (isEnabled) {
          optedIn.push(rec);
        }
      } catch (err) {
        logger.error(err, `[RecipientService] Error checking broadcast preferences for ${rec.userId}`);
        optedIn.push(rec);
      }
    }

    return optedIn;
  }
}
export default RecipientService;
