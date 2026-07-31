import { Router } from "express";
import { MaintenanceController } from "./maintenance.controller.js";

export const maintenanceRouter = Router();

/**
 * @swagger
 * /api/v1/maintenance:
 *   get:
 *     summary: Retrieve summary for maintenance
 *     tags: [Maintenance]
 *     responses:
 *       200:
 *         description: Operation successful
 */
maintenanceRouter.get("/", MaintenanceController.getSummary);
