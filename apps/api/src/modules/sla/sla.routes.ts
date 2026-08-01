import { Router } from "express";
import { SlaController } from "./sla.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const slaRouter = Router();

// Apply authentication to all routes
slaRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/sla:
 *   get:
 *     summary: Retrieve summary for sla
 *     tags: [Sla]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
slaRouter.get("/", SlaController.getSummary);
