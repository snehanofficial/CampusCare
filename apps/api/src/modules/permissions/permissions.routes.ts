import { Router } from "express";
import { PermissionsController } from "./permissions.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

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

/**
 * @swagger
 * /api/v1/permissions/registry:
 *   get:
 *     summary: Full permission registry grouped by category
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: Operation successful
 */
permissionsRouter.get("/registry", authenticate, PermissionsController.getRegistry);
