import { Router } from "express";
import { ReportsController } from "./reports.controller.js";

export const reportsRouter = Router();

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: Retrieve summary for reports
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Operation successful
 */
reportsRouter.get("/", ReportsController.getSummary);
