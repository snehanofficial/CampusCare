import { Router } from "express";
import { ReportsController } from "./reports.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import { exportReportSchema } from "./reports.validator.js";

export const reportsRouter = Router();

// Apply authentication to all routes
reportsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: Get the catalog of available report types
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of report definitions
 */
reportsRouter.get("/", authenticate, authorize("reports:view"), ReportsController.getAvailableReports);

/**
 * @swagger
 * /api/v1/reports/history:
 *   get:
 *     summary: Get recent report generation history
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
reportsRouter.get("/history", authenticate, authorize("reports:view"), ReportsController.getReportHistory);

/**
 * @swagger
 * /api/v1/reports/export:
 *   post:
 *     summary: Export a report in PDF, Excel, or CSV format
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 */
reportsRouter.post(
  "/export",
  authenticate,
  authorize("reports:export"),
  validate(exportReportSchema),
  ReportsController.exportReport
);

/**
 * @swagger
 * /api/v1/reports/{type}:
 *   get:
 *     summary: Generate a specific report type with optional filters
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [TICKET_REPORT, ASSET_REPORT, INVENTORY_REPORT, MAINTENANCE_REPORT, SLA_REPORT, INCIDENT_REPORT]
 */
reportsRouter.get("/:type", authenticate, authorize("reports:view"), ReportsController.generateReport);

export default reportsRouter;
