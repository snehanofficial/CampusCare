import { Router } from "express";
import { SettingsController } from "./settings.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const settingsRouter = Router();

// Apply authentication to all routes
settingsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Retrieve summary for settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
settingsRouter.get("/", SettingsController.getSummary);
