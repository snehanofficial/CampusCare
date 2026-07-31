import { Router } from "express";
import { SettingsController } from "./settings.controller.js";

export const settingsRouter = Router();

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Retrieve summary for settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Operation successful
 */
settingsRouter.get("/", SettingsController.getSummary);
