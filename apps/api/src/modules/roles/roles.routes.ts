import { Router } from "express";
import { RolesController } from "./roles.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const rolesRouter = Router();

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Retrieve list of roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Operation successful
 */
rolesRouter.get("/", authenticate, RolesController.list);

