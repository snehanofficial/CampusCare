import { Router } from "express";
import { UsersController } from "./users.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export const usersRouter = Router();

// Apply authentication to all routes
usersRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List user accounts
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
usersRouter.get("/", authenticate, authorize("users:read"), UsersController.list);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Operation successful
 */
usersRouter.get("/:id", authenticate, authorize("users:read"), UsersController.getById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user account
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: User created successfully
 */
usersRouter.post("/", authenticate, authorize("users:manage"), UsersController.create);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update an existing user account
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User updated successfully
 */
usersRouter.put("/:id", authenticate, authorize("users:manage"), UsersController.update);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete or deactivate a user account
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User deleted or deactivated successfully
 */
usersRouter.delete("/:id", authenticate, authorize("users:manage"), UsersController.delete);
