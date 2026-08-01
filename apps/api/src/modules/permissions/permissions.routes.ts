import { Router } from "express";
import { PermissionsController } from "./permissions.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const permissionsRouter = Router();

// Apply authentication to all routes
permissionsRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Retrieve summary for permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
permissionsRouter.get("/", PermissionsController.getSummary);
