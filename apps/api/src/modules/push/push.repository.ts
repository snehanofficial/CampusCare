import { prisma } from "../../database/prisma.js";
import type { PushSubscriptionInput } from "./push.validator.js";

export class PushRepository {
  /**
   * Save a user's browser push subscription (upsert by endpoint).
   */
  static async saveSubscription(userId: string, input: PushSubscriptionInput) {
    return await prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      },
    });
  }

  /**
   * Remove a push subscription by its endpoint.
   */
  static async removeSubscription(endpoint: string) {
    try {
      return await prisma.pushSubscription.delete({
        where: { endpoint },
      });
    } catch {
      // Gracefully ignore delete errors if record does not exist
      return null;
    }
  }

  /**
   * Get all active push subscriptions for a user.
   */
  static async getSubscriptionsByUserId(userId: string) {
    return await prisma.pushSubscription.findMany({
      where: { userId },
    });
  }

  /**
   * Get all subscriptions.
   */
  static async getAllSubscriptions() {
    return await prisma.pushSubscription.findMany();
  }
}
export default PushRepository;
