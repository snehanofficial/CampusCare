import { Router } from "express";
import { AssetsController } from "./assets.controller.js";

export const assetsRouter = Router();

/**
 * @swagger
 * /api/v1/assets:
 *   get:
 *     summary: Retrieve summary for assets
 *     tags: [Assets]
 *     responses:
 *       200:
 *         description: Operation successful
 */
assetsRouter.get("/", AssetsController.getSummary);
