import { Router } from "express";
import { AutomationController } from "./automation.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const automationRouter = Router();

// Apply authentication to all routes
automationRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/automation:
 *   get:
 *     summary: Retrieve summary for automation
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
automationRouter.get("/", AutomationController.getSummary);
