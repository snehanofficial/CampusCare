import { logger } from "../../utils/logger.js";
import { eventBus } from "../../utils/event-bus.js";
import { NotFoundError } from "../../utils/errors.js";
import type { ArticleListParams, ArticleCreateInput, ArticleUpdateInput, FeedbackInput } from "./knowledge-base.types.js";
import {
  findArticles,
  findArticleBySlug,
  findArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  upsertFeedback,
  searchArticles,
  findCategories,
  findCategoryById,
  createCategory,
  findSlugExists,
} from "./knowledge-base.repository.js";

// ─── Slug Generator ───────────────────────────────────────────────────────────

async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);

  let slug = base;
  let suffix = 1;

  while (await findSlugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
}

// ─── HTML Content Sanitizer (simple allow-list) ───────────────────────────────

function sanitizeContent(raw: string): string {
  // Remove potentially dangerous tags/attributes
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

// ─── Knowledge Base Service ───────────────────────────────────────────────────

export class KnowledgeBaseService {
  static async listArticles(params: ArticleListParams) {
    logger.debug({ params }, "Executing KnowledgeBaseService.listArticles");
    return findArticles(params);
  }

  static async getArticle(slug: string) {
    logger.debug({ slug }, "Executing KnowledgeBaseService.getArticle");
    const article = await findArticleBySlug(slug);
    if (!article) {
      throw new NotFoundError(`Knowledge base article not found: ${slug}`);
    }
    return article;
  }

  static async getArticleById(id: string) {
    logger.debug({ id }, "Executing KnowledgeBaseService.getArticleById");
    const article = await findArticleById(id);
    if (!article) {
      throw new NotFoundError(`Knowledge base article not found`);
    }
    return article;
  }

  static async createArticle(data: ArticleCreateInput, userId: string) {
    logger.info({ title: data.title, userId }, "Executing KnowledgeBaseService.createArticle");

    const slug = await generateUniqueSlug(data.title);
    const sanitizedContent = sanitizeContent(data.content);

    const article = await createArticle({
      ...data,
      content: sanitizedContent,
      slug,
      createdById: userId,
    });

    eventBus.publish("knowledge.article.created", {
      articleId: article.id,
      title: article.title,
      createdById: userId,
    });

    return article;
  }

  static async updateArticle(id: string, data: ArticleUpdateInput, userId: string) {
    logger.info({ id, userId }, "Executing KnowledgeBaseService.updateArticle");

    await this.getArticleById(id); // throws if not found

    const sanitizedContent = data.content ? sanitizeContent(data.content) : undefined;

    const updated = await updateArticle(id, {
      ...data,
      ...(sanitizedContent ? { content: sanitizedContent } : {}),
      updatedById: userId,
    });

    eventBus.publish("knowledge.article.updated", {
      articleId: id,
      updatedById: userId,
    });

    return updated;
  }

  static async publishArticle(id: string, userId: string) {
    logger.info({ id, userId }, "Executing KnowledgeBaseService.publishArticle");

    await this.getArticleById(id); // throws if not found

    const published = await updateArticle(id, {
      status: "PUBLISHED",
      updatedById: userId,
    });

    eventBus.publish("knowledge.article.published", {
      articleId: id,
      publishedById: userId,
    });

    return published;
  }

  static async deleteArticle(id: string) {
    logger.info({ id }, "Executing KnowledgeBaseService.deleteArticle");
    await this.getArticleById(id); // throws if not found
    return deleteArticle(id);
  }

  static async submitFeedback(articleId: string, userId: string, data: FeedbackInput) {
    logger.debug({ articleId, userId, helpful: data.helpful }, "Executing KnowledgeBaseService.submitFeedback");
    const article = await findArticleById(articleId);
    if (!article) {
      throw new NotFoundError(`Knowledge base article not found`);
    }
    return upsertFeedback(articleId, userId, data);
  }

  static async searchArticles(query: string) {
    logger.debug({ query }, "Executing KnowledgeBaseService.searchArticles");
    return searchArticles(query);
  }

  static async getCategories() {
    logger.debug("Executing KnowledgeBaseService.getCategories");
    return findCategories();
  }

  static async createCategory(data: { name: string; description?: string }, userId: string) {
    logger.info({ name: data.name, userId }, "Executing KnowledgeBaseService.createCategory");
    return createCategory(data);
  }
}
