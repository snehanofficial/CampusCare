import { Router } from "express";
import { TicketsController } from "./tickets.controller.js";

export const ticketsRouter = Router();

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     summary: Retrieve summary for tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Operation successful
 */
ticketsRouter.get("/", TicketsController.getSummary);
