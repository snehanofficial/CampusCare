import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authRateLimit } from "../../middleware/rate-limit.js";

export const authRouter = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
authRouter.post("/register", AuthController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 */
authRouter.post("/login", authRateLimit, AuthController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh the access token using cookie
 *     tags: [Auth]
 */
authRouter.post("/refresh", authRateLimit, AuthController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out current session
 *     tags: [Auth]
 */
authRouter.post("/logout", AuthController.logout);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get currently authenticated user details
 *     tags: [Auth]
 */
authRouter.get("/me", authenticate, AuthController.me);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Auth]
 */
authRouter.get("/sessions", authenticate, AuthController.getSessions);

/**
 * @swagger
 * /api/v1/auth/sessions/:sessionId:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Auth]
 */
authRouter.delete("/sessions/:sessionId", authenticate, AuthController.revokeSession);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   delete:
 *     summary: Revoke all active sessions (logout all devices)
 *     tags: [Auth]
 */
authRouter.delete("/sessions", authenticate, AuthController.logoutAll);

export default authRouter;
