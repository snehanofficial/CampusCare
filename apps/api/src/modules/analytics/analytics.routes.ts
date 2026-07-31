import { Router } from "express";
import { AnalyticsController } from "./analytics.controller.js";

export const analyticsRouter = Router();

/**
 * @swagger
 * /api/v1/analytics:
 *   get:
 *     summary: Retrieve summary for analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Operation successful
 */
analyticsRouter.get("/", AnalyticsController.getSummary);
