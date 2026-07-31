import { Router } from "express";
import { UsersController } from "./users.controller.js";

export const usersRouter = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Retrieve summary for users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Operation successful
 */
usersRouter.get("/", UsersController.getSummary);
