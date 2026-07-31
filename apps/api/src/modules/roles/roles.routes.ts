import { Router } from "express";
import { RolesController } from "./roles.controller.js";

export const rolesRouter = Router();

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Retrieve summary for roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Operation successful
 */
rolesRouter.get("/", RolesController.getSummary);
