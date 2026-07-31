import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";

export const notificationsRouter = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Retrieve summary for notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Operation successful
 */
notificationsRouter.get("/", NotificationsController.getSummary);
