import { Router } from "express";
import { KnowledgeBaseController } from "./knowledge-base.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

export const knowledgeBaseRouter = Router();

// Apply authentication to all routes
knowledgeBaseRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/knowledge-base:
 *   get:
 *     summary: Retrieve summary for knowledge-base
 *     tags: [KnowledgeBase]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operation successful
 */
knowledgeBaseRouter.get("/", KnowledgeBaseController.getSummary);
