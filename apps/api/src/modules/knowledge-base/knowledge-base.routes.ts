import { Router } from "express";
import { KnowledgeBaseController } from "./knowledge-base.controller.js";

export const knowledgeBaseRouter = Router();

/**
 * @swagger
 * /api/v1/knowledge-base:
 *   get:
 *     summary: Retrieve summary for knowledge-base
 *     tags: [KnowledgeBase]
 *     responses:
 *       200:
 *         description: Operation successful
 */
knowledgeBaseRouter.get("/", KnowledgeBaseController.getSummary);
