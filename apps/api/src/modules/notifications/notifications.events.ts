import { eventBus } from "../../utils/event-bus.js";
import { NotificationsService } from "./notifications.service.js";
import { logger } from "../../utils/logger.js";

export function initNotificationListeners() {
  logger.info("Initializing event-driven Notification listeners...");

  // 1. Ticket Created -> notify creator
  eventBus.subscribe("ticket.created", async (data: any) => {
    try {
      const { ticketId, ticketNumber, title, creatorId } = data;
      await NotificationsService.sendNotification({
        userId: creatorId,
        title: "Ticket Registered Successfully",
        message: `Your ticket ${ticketNumber} ("${title}") has been registered.`,
        category: "TICKET",
        type: "SUCCESS",
        referenceId: ticketId,
        actionUrl: `/tickets`
      });
    } catch (err) {
      logger.error(err, "Error handling event ticket.created in notification system");
    }
  });

  // 2. Ticket Assigned -> notify assignee
  eventBus.subscribe("ticket.assigned", async (data: any) => {
    try {
      const { ticketId, ticketNumber, assigneeId, title } = data;
      await NotificationsService.sendNotification({
        userId: assigneeId,
        title: "Ticket Assigned to You",
        message: `Ticket ${ticketNumber} ("${title}") has been assigned to you.`,
        category: "TICKET",
        type: "INFO",
        referenceId: ticketId,
        actionUrl: `/tickets`
      });
    } catch (err) {
      logger.error(err, "Error handling event ticket.assigned in notification system");
    }
  });

  // 3. Ticket Resolved -> notify creator
  eventBus.subscribe("ticket.resolved", async (data: any) => {
    try {
      const { ticketId, ticketNumber, creatorId, title } = data;
      await NotificationsService.sendNotification({
        userId: creatorId,
        title: "Ticket Resolved",
        message: `Your ticket ${ticketNumber} ("${title}") has been resolved.`,
        category: "TICKET",
        type: "SUCCESS",
        referenceId: ticketId,
        actionUrl: `/tickets`
      });
    } catch (err) {
      logger.error(err, "Error handling event ticket.resolved in notification system");
    }
  });

  // 4. Incident Created -> notify technician list
  eventBus.subscribe("incident.created", async (data: any) => {
    try {
      const { incidentId, title, technicianIds } = data;
      const dispatches = (technicianIds as string[]).map((techId) =>
        NotificationsService.sendNotification({
          userId: techId,
          title: "New Incident Logged",
          message: `Incident event: "${title}" requires support review.`,
          category: "INCIDENT",
          type: "WARNING",
          referenceId: incidentId,
          actionUrl: `/incidents`
        }).catch((err) => {
          logger.error(`Error sending incident notification to technician ${techId}`, err);
        })
      );
      await Promise.all(dispatches);
    } catch (err) {
      logger.error(err, "Error handling event incident.created in notification system");
    }
  });

  // 5. Asset Assigned -> notify user
  eventBus.subscribe("asset.assigned", async (data: any) => {
    try {
      const { assetId, assetName, tag, userId } = data;
      await NotificationsService.sendNotification({
        userId: userId,
        title: "Asset Assigned",
        message: `Asset "${assetName}" (${tag}) has been assigned to you.`,
        category: "ASSET",
        type: "INFO",
        referenceId: assetId,
        actionUrl: `/assets`
      });
    } catch (err) {
      logger.error(err, "Error handling event asset.assigned in notification system");
    }
  });

  // 6. Low Stock Detected -> notify inventory managers
  eventBus.subscribe("inventory.low-stock", async (data: any) => {
    try {
      const { itemId, itemName, quantity, managerIds } = data;
      const dispatches = (managerIds as string[]).map((mId) =>
        NotificationsService.sendNotification({
          userId: mId,
          title: "Low Stock Alert",
          message: `Inventory item "${itemName}" has low stock (${quantity} items remaining).`,
          category: "INVENTORY",
          type: "WARNING",
          referenceId: itemId,
          actionUrl: `/inventory`
        }).catch((err) => {
          logger.error(`Error sending low-stock notification to manager ${mId}`, err);
        })
      );
      await Promise.all(dispatches);
    } catch (err) {
      logger.error(err, "Error handling event inventory.low-stock in notification system");
    }
  });
}
