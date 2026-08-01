import { Router } from "express";
import { KnowledgeBaseController } from "./knowledge-base.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  createArticleSchema,
  updateArticleSchema,
  feedbackSchema,
  createCategorySchema,
} from "./knowledge-base.validator.js";

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
knowledgeBaseRouter.get("/", authenticate, KnowledgeBaseController.listArticles);

/**
 * @swagger
 * /api/v1/knowledge-base/categories:
 *   get:
 *     summary: List all knowledge base categories
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.get("/categories", authenticate, KnowledgeBaseController.getCategories);

/**
 * @swagger
 * /api/v1/knowledge-base/categories:
 *   post:
 *     summary: Create a knowledge base category
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.post(
  "/categories",
  authenticate,
  authorize("knowledge-base:manage"),
  validate(createCategorySchema),
  KnowledgeBaseController.createCategory
);

/**
 * @swagger
 * /api/v1/knowledge-base/search:
 *   get:
 *     summary: Search articles by keyword (title, content, tags)
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.get("/search", authenticate, KnowledgeBaseController.searchArticles);

/**
 * @swagger
 * /api/v1/knowledge-base:
 *   post:
 *     summary: Create a new knowledge base article
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 */
knowledgeBaseRouter.post(
  "/",
  authenticate,
  authorize("knowledge-base:manage"),
  validate(createArticleSchema),
  KnowledgeBaseController.createArticle
);

/**
 * @swagger
 * /api/v1/knowledge-base/{id}:
 *   patch:
 *     summary: Update an existing article
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.patch(
  "/:id",
  authenticate,
  authorize("knowledge-base:manage"),
  validate(updateArticleSchema),
  KnowledgeBaseController.updateArticle
);

/**
 * @swagger
 * /api/v1/knowledge-base/{id}/publish:
 *   patch:
 *     summary: Publish a draft article
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.patch(
  "/:id/publish",
  authenticate,
  authorize("knowledge-base:manage"),
  KnowledgeBaseController.publishArticle
);

/**
 * @swagger
 * /api/v1/knowledge-base/{id}:
 *   delete:
 *     summary: Delete a knowledge base article
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.delete(
  "/:id",
  authenticate,
  authorize("knowledge-base:manage"),
  KnowledgeBaseController.deleteArticle
);

/**
 * @swagger
 * /api/v1/knowledge-base/{id}/feedback:
 *   post:
 *     summary: Submit helpful/not-helpful feedback for an article
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.post(
  "/:id/feedback",
  authenticate,
  validate(feedbackSchema),
  KnowledgeBaseController.submitFeedback
);

/**
 * @swagger
 * /api/v1/knowledge-base/{slug}:
 *   get:
 *     summary: Get a single article by slug
 *     tags: [Knowledge Base]
 */
knowledgeBaseRouter.get("/:slug", authenticate, KnowledgeBaseController.getArticle);

export default knowledgeBaseRouter;
