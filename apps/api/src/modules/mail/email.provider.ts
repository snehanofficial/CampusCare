import { NotificationProvider } from "../notifications/providers/provider.interface.js";
import { EmailQueue } from "./queue/email.queue.js";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

export class EmailProvider implements NotificationProvider {
  /**
   * Implement send logic for notification dispatch. Loads user data,
   * compiles template parameters, and enqueues the email task.
   */
  async send(params: {
    userId: string;
    title: string;
    message: string;
    category: string;
    type: string;
    referenceId?: string;
    actionUrl?: string;
    recipientType?: string;
    eventType?: string;
  }): Promise<void> {
    try {
      // 1. Load user profile details
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, firstName: true, lastName: true },
      });

      if (!user) {
        logger.error(`[EmailProvider] User ID ${params.userId} not found in database. Aborting email.`);
        return;
      }

      // 2. Select Handlebars template file name based on category and title checks
      let templateName = "ticket-created";
      const catUpper = params.category?.toUpperCase();
      const titleLower = params.title?.toLowerCase();

      if (catUpper === "INCIDENT") {
        templateName = "incident-created";
      } else if (catUpper === "SLA") {
        templateName = "sla-warning";
      } else if (titleLower.includes("assigned")) {
        templateName = "ticket-assigned";
      } else if (titleLower.includes("resolved") || titleLower.includes("closed")) {
        templateName = "ticket-resolved";
      } else if (titleLower.includes("password")) {
        templateName = "password-reset";
      } else if (catUpper === "SYSTEM") {
        templateName = "system-announcement";
      }

      // 3. Populate template parameters
      const variables = {
        subject: params.title,
        recipientName: `${user.firstName} ${user.lastName}`,
        ticketNumber: params.referenceId ? `TKT-${params.referenceId.slice(0, 8).toUpperCase()}` : "CC-ALERT",
        title: params.title,
        priority: params.type,
        description: params.message,
        message: params.message, // For system announcements
        actionUrl: params.actionUrl || "http://localhost:5173/notifications", // Redirect broadcasts to notifications list
        resolution: params.message, // For ticket-resolved view
        incidentNumber: params.referenceId ? `INC-${params.referenceId.slice(0, 8).toUpperCase()}` : "INC-ALERT",
        severity: params.type,
        slaLimitHours: 4,
        timeRemaining: "1 hour",
        createdBy: "IT Administration Desk",
        date: new Date().toLocaleDateString("en-US", { dateStyle: "long" })
      };

      // 4. Dispatch onto in-memory queue
      await EmailQueue.enqueue(user.email, templateName, variables, {
        recipientType: params.recipientType || "USER",
        eventType: params.eventType || "SYSTEM",
        userId: params.userId,
      });
    } catch (err) {
      logger.error(err, `[EmailProvider] Error occurred resolving email for user ${params.userId}`);
    }
  }
}
export default EmailProvider;
