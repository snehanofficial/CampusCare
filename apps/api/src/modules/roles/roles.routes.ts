import { Router } from "express";
import { RolesController } from "./roles.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const rolesRouter = Router();

// Apply authentication to all routes
rolesRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Retrieve list of roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
rolesRouter.get("/", authenticate, RolesController.list);

