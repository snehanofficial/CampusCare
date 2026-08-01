import { Router } from "express";
import { NotificationsController } from "./notifications.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const notificationsRouter = Router();

// Apply authentication to all routes
notificationsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Retrieve summary for notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
notificationsRouter.get("/", NotificationsController.getSummary);
