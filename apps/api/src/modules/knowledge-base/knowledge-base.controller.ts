import { Request, Response, NextFunction } from "express";
import { KnowledgeBaseService } from "./knowledge-base.service.js";
import { sendSuccess } from "../../middleware/response.js";
import { NotFoundError } from "../../utils/errors.js";
import type { ArticleListParams } from "./knowledge-base.types.js";

export class KnowledgeBaseController {
  /**
   * GET /api/v1/knowledge-base
   * List articles with optional filters.
   */
  static async listArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin =
        req.user?.role === "SYSTEM_ADMIN" ||
        req.user?.role === "DEPT_ADMIN" ||
        (req.user?.permissions ?? []).includes("knowledge-base:manage");

      const params: ArticleListParams = {
        categoryId: req.query.categoryId as string | undefined,
        status: req.query.status as "DRAFT" | "PUBLISHED" | undefined,
        tag: req.query.tag as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
        includeAll: isAdmin,
      };

      const result = await KnowledgeBaseService.listArticles(params);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/knowledge-base/categories
   * List all categories.
   */
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await KnowledgeBaseService.getCategories();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/knowledge-base/categories
   * Create a new category (admin only).
   */
  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await KnowledgeBaseService.createCategory(req.body, userId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/knowledge-base/search?q=...
   * Deterministic keyword search.
   */
  static async searchArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) ?? "";
      const result = await KnowledgeBaseService.searchArticles(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/knowledge-base/:slug
   * Get article by slug (increments view count).
   */
  static async getArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params as { slug: string };
      const result = await KnowledgeBaseService.getArticle(slug);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/knowledge-base
   * Create a new article (admin only).
   */
  static async createArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await KnowledgeBaseService.createArticle(req.body, userId);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/knowledge-base/:id
   * Update an article (admin only).
   */
  static async updateArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const result = await KnowledgeBaseService.updateArticle(id, req.body, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/knowledge-base/:id/publish
   * Publish a draft article (admin only).
   */
  static async publishArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const result = await KnowledgeBaseService.publishArticle(id, userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/knowledge-base/:id
   * Delete an article (admin only).
   */
  static async deleteArticle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await KnowledgeBaseService.deleteArticle(id);
      sendSuccess(res, { deleted: true });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/knowledge-base/:id/feedback
   * Submit helpful/not-helpful feedback (authenticated users).
   */
  static async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const { helpful, comment } = req.body;
      const result = await KnowledgeBaseService.submitFeedback(id, userId, { helpful, comment });
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
}
