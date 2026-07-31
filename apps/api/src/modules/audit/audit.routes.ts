import { Router } from "express";
import { AuditController } from "./audit.controller.js";

export const auditRouter = Router();

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Retrieve summary for audit
 *     tags: [Audit]
 *     responses:
 *       200:
 *         description: Operation successful
 */
auditRouter.get("/", AuditController.getSummary);
