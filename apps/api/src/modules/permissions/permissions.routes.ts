import { Router } from "express";
import { PermissionsController } from "./permissions.controller.js";

export const permissionsRouter = Router();

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Retrieve summary for permissions
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: Operation successful
 */
permissionsRouter.get("/", PermissionsController.getSummary);
