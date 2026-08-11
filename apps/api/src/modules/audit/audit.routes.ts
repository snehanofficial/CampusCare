import { Router } from "express";
import { AuditController } from "./audit.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const auditRouter = Router();

// Apply authentication to all routes
auditRouter.use(authenticate);
auditRouter.use(authorize("audit:read"));

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Retrieve summary for audit
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
auditRouter.get("/", AuditController.getSummary);
