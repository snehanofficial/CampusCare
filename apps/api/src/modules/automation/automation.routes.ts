import { Router } from "express";
import { AutomationController } from "./automation.controller.js";

export const automationRouter = Router();

/**
 * @swagger
 * /api/v1/automation:
 *   get:
 *     summary: Retrieve summary for automation
 *     tags: [Automation]
 *     responses:
 *       200:
 *         description: Operation successful
 */
automationRouter.get("/", AutomationController.getSummary);
