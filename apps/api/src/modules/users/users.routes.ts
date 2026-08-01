import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const usersRouter = Router();

// Apply authentication to all routes
usersRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve summary for users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
usersRouter.get("/", UsersController.getSummary);
