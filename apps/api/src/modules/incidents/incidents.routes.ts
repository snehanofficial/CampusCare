import { Router } from "express";
import { IncidentsController } from "./incidents.controller.js";

export const incidentsRouter = Router();

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: Retrieve summary for incidents
 *     tags: [Incidents]
 *     responses:
 *       200:
 *         description: Operation successful
 */
incidentsRouter.get("/", IncidentsController.getSummary);
