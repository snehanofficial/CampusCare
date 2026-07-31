import { Router } from "express";
import { SlaController } from "./sla.controller.js";

export const slaRouter = Router();

/**
 * @swagger
 * /api/v1/sla:
 *   get:
 *     summary: Retrieve summary for sla
 *     tags: [Sla]
 *     responses:
 *       200:
 *         description: Operation successful
 */
slaRouter.get("/", SlaController.getSummary);
