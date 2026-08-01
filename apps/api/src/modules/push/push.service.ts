import webpush from "web-push";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { PushRepository } from "./push.repository.js";

webpush.setVapidDetails(
  `mailto:${env.VAPID_EMAIL}`,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

export class PushService {
  /**
   * Deliver a push payload to a single subscription.
   * Auto-deletes the subscription from database on 410 Gone / 404 Not Found responses.
   */
  static async sendPushNotification(
    subscription: { endpoint: string; auth: string; p256dh: string },
    payload: { title: string; message: string; category?: string; type?: string; actionUrl?: string }
  ): Promise<void> {
    try {
      logger.info({ endpoint: subscription.endpoint }, "[PushService] Dispatching web push payload");
      
      const payloadString = JSON.stringify({
        title: payload.title,
        message: payload.message,
        icon: "/icon-192.png",
        url: payload.actionUrl || "/dashboard",
        category: payload.category || "SYSTEM",
        priority: payload.type || "MEDIUM",
        timestamp: Date.now(),
      });

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        },
        payloadString
      );

      logger.debug("[PushService] Push notification delivered successfully");
    } catch (err: any) {
      // 404 or 410 indicate the push subscription is expired or revoked by browser
      if (err.statusCode === 410 || err.statusCode === 404) {
        logger.warn(
          { endpoint: subscription.endpoint, statusCode: err.statusCode },
          "[PushService] Pruning expired push subscription"
        );
        await PushRepository.removeSubscription(subscription.endpoint);
      } else {
        logger.error(err, "[PushService] Error delivering web push notification");
      }
    }
  }

  /**
   * Dispatch a push notification to all devices registered by a specific user.
   */
  static async sendToUser(
    userId: string,
    payload: { title: string; message: string; category?: string; type?: string; actionUrl?: string }
  ): Promise<void> {
    const subscriptions = await PushRepository.getSubscriptionsByUserId(userId);
    if (!subscriptions || subscriptions.length === 0) return;

    logger.info({ userId, count: subscriptions.length }, "[PushService] Dispatching to user devices");

    const dispatches = subscriptions.map((sub) =>
      this.sendPushNotification(sub, payload).catch((err) => {
        logger.error(err, `[PushService] Failed device push for user ${userId}`);
      })
    );

    await Promise.all(dispatches);
  }

  /**
   * Cleanup task to scan and remove any orphaned expired subscriptions.
   */
  static async cleanupExpiredSubscriptions(): Promise<void> {
    logger.info("[PushService] Running expired subscription pruner");
    // Under Web Push API, expiration is captured lazily during dispatch, but this serves as a placeholder for batch queries.
  }
}
export default PushService;
