import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const reportsRouter = Router();

// Apply authentication to all routes
reportsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: Retrieve summary for reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
reportsRouter.get("/", ReportsController.getSummary);
