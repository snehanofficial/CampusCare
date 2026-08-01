import { prisma } from "../../database/prisma.js";

export class EmailPreferenceRepository {
  /**
   * Retrieve all customized email preferences for a user.
   */
  static async getPreferencesByUserId(userId: string) {
    return prisma.emailPreference.findMany({
      where: { userId }
    });
  }

  /**
   * Check whether a specific email event is enabled for a user.
   * Returns true by default if no setting is configured.
   */
  static async isEmailEnabled(userId: string, eventType: string): Promise<boolean> {
    const preference = await prisma.emailPreference.findUnique({
      where: {
        userId_eventType: {
          userId,
          eventType
        }
      }
    });

    return preference ? preference.enabled : true;
  }

  /**
   * Upsert a user's notification event email preferences.
   */
  static async upsertPreferences(
    userId: string,
    updates: Array<{ eventType: string; enabled: boolean }>
  ) {
    const operations = updates.map((update) =>
      prisma.emailPreference.upsert({
        where: {
          userId_eventType: {
            userId,
            eventType: update.eventType
          }
        },
        create: {
          userId,
          eventType: update.eventType,
          enabled: update.enabled
        },
        update: {
          enabled: update.enabled
        }
      })
    );

    return prisma.$transaction(operations);
  }
}
export default EmailPreferenceRepository;
