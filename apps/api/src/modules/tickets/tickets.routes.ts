import { Router } from "express";
import { TicketsController } from "./tickets.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const ticketsRouter = Router();

// Apply authentication to all routes
ticketsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     summary: Retrieve summary for tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
ticketsRouter.get("/", TicketsController.getSummary);
