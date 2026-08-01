import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { InAppProvider } from "./providers/in-app.provider.js";
import { EmailProvider } from "./providers/email.provider.js";
import { PushProvider } from "./providers/push.provider.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.js";
import { EmailPreferenceService } from "../email-preferences/email-preference.service.js";
import { RecipientService } from "../mail/recipient/recipient.service.js";
import { RecipientResolver } from "../mail/recipient/recipient.resolver.js";

const categories = ["TICKET", "INCIDENT", "ASSET", "MAINTENANCE", "INVENTORY", "SLA", "SYSTEM"] as const;

export class NotificationsService {
  private static providers = {
    inApp: new InAppProvider(),
    email: new EmailProvider(),
    push: new PushProvider(),
  };

  /**
   * List notifications for a specific user with pagination, search, and category filters.
   */
  static async list(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      category?: string;
      search?: string;
    }
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 10)));
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { message: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return {
      data: items,
      total,
      page,
      pageSize: limit,
      pageCount,
    };
  }

  /**
   * Mark a single user notification as read.
   */
  static async markAsRead(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("Cannot modify another user's notification");
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications of a user as read.
   */
  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return true;
  }

  /**
   * Delete/Dismiss a single user notification.
   */
  static async delete(userId: string, id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("Cannot delete another user's notification");
    }

    await prisma.notification.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Retrieve notification preferences for a user, filling in system defaults for unset categories.
   */
  static async getPreferences(userId: string) {
    const userPrefs = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    const prefMap = new Map<string, any>(userPrefs.map((p) => [p.category, p]));

    // Fill in default values for any category not configured in database
    return categories.map((cat) => {
      const match = prefMap.get(cat);
      return {
        id: match?.id || "",
        userId,
        category: cat,
        email: match ? match.email : true,
        inApp: match ? match.inApp : true,
        push: match ? match.push : true,
        createdAt: match?.createdAt || new Date(),
        updatedAt: match?.updatedAt || new Date(),
      };
    });
  }

  /**
   * Upsert a user's communication channel configurations.
   */
  static async updatePreferences(
    userId: string,
    updates: Array<{ category: string; email: boolean; inApp: boolean; push: boolean }>
  ) {
    const results = [];
    for (const update of updates) {
      const result = await prisma.notificationPreference.upsert({
        where: {
          userId_category: {
            userId,
            category: update.category,
          },
        },
        create: {
          userId,
          category: update.category,
          email: update.email,
          inApp: update.inApp,
          push: update.push,
        },
        update: {
          email: update.email,
          inApp: update.inApp,
          push: update.push,
        },
      });
      results.push(result);
    }
    return results;
  }

  /**
   * Send a notification to a specific user using their delivery channel preferences.
   */
  static async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
    sendEmail?: boolean;
  }) {
    logger.debug(params, `[NotificationsService] Processing notification event for ${params.userId}`);

    // 1. Get user preferences for category
    const userPrefs = await prisma.notificationPreference.findUnique({
      where: {
        userId_category: {
          userId: params.userId,
          category: params.category,
        },
      },
    });

    const emailEnabled = params.sendEmail !== false && (userPrefs ? userPrefs.email : true);
    const inAppEnabled = userPrefs ? userPrefs.inApp : true;
    const pushEnabled = userPrefs ? userPrefs.push : true;

    const dispatches: Promise<void>[] = [];

    // 2. Dispatch to each enabled channel provider
    if (inAppEnabled) {
      dispatches.push(
        this.providers.inApp.send(params).catch((err) => {
          logger.error(`[InAppProvider] Error dispatching notification to user ${params.userId}`, err);
        })
      );
    }

    if (emailEnabled) {
      const recipients = await RecipientService.resolveAndFilterOptedIn({
        userId: params.userId,
        category: params.category,
        title: params.title,
        referenceId: params.referenceId,
      });

      const eventType = EmailPreferenceService.mapNotificationToEmailEvent(params.category, params.title) || "SYSTEM";

      for (const rec of recipients) {
        dispatches.push(
          this.providers.email.send({
            ...params,
            userId: rec.userId,
            recipientType: rec.recipientType,
            eventType: eventType,
          }).catch((err) => {
            logger.error(`[EmailProvider] Error dispatching notification to user ${rec.userId}`, err);
          })
        );
      }
    }

    if (pushEnabled) {
      dispatches.push(
        this.providers.push.send(params).catch((err) => {
          logger.error(`[PushProvider] Error dispatching notification to user ${params.userId}`, err);
        })
      );
    }

    await Promise.all(dispatches);
  }

  /**
   * Broadcast a notification to all active users in the database.
   */
  static async broadcast(params: {
    title: string;
    message: string;
    type: string;
    category: string;
    referenceId?: string;
    actionUrl?: string;
    sendEmail?: boolean;
    createdBy?: string;
    audience?: string;
    customUserIds?: string[];
  }) {
    logger.info(`[NotificationsService] Broadcasting announcement: "${params.title}"`);

    // Write audit history record for this global system announcement
    try {
      await prisma.systemNotification.create({
        data: {
          title: params.title,
          message: params.message,
          sendEmail: params.sendEmail || false,
          createdBy: params.createdBy || "ADMIN",
        }
      });
    } catch (err) {
      logger.error(err, "Failed to create SystemNotification audit log in database");
    }

    const audienceType = (params.audience as any) || "ALL_USERS";
    const customUserIds = params.customUserIds || [];

    // 1. If email dispatch is requested, resolve audience and filter by preferences
    if (params.sendEmail) {
      RecipientService.resolveAndFilterAudience(audienceType, customUserIds)
        .then((emailRecipients) => {
          logger.info(`[NotificationsService] Dispatching broadcast email to ${emailRecipients.length} opted-in users`);
          for (const rec of emailRecipients) {
            this.providers.email.send({
              userId: rec.userId,
              title: params.title,
              message: params.message,
              category: "SYSTEM",
              type: params.type,
              recipientType: rec.recipientType,
              eventType: "SYSTEM_ANNOUNCEMENT",
              actionUrl: params.actionUrl,
            }).catch((err) => {
              logger.error(`Error sending broadcast email to user ${rec.userId}`, err);
            });
          }
        })
        .catch((err) => {
          logger.error(err, "[NotificationsService] Failed resolving email broadcast recipients");
        });
    }

    // 2. Dispatch in-app and push notifications to all active users matching the targeted audience group
    const targetAudience = await RecipientResolver.resolveAudience(audienceType, customUserIds);
    
    const dispatches = targetAudience.map((rec) =>
      this.sendNotification({
        userId: rec.userId,
        title: params.title,
        message: params.message,
        category: params.category,
        type: params.type,
        referenceId: params.referenceId,
        actionUrl: params.actionUrl,
        sendEmail: false, // Prevent duplicate email triggers
      }).catch((err) => {
        logger.error(`Error sending broadcast notification to user ${rec.userId}`, err);
      })
    );

    await Promise.all(dispatches);
    return true;
  }
}
