import { Router } from "express";
import { AnalyticsController } from "./analytics.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const analyticsRouter = Router();

// Apply authentication to all routes
analyticsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/analytics:
 *   get:
 *     summary: Retrieve summary for analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
analyticsRouter.get("/", AnalyticsController.getSummary);
