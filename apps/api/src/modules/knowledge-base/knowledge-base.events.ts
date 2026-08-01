import { eventBus } from "../../utils/event-bus.js";
import { logger } from "../../utils/logger.js";
import { prisma } from "../../database/prisma.js";

/**
 * Knowledge Base Domain Event Handlers.
 * Subscribes to KB events and writes audit log entries.
 */

function registerKnowledgeBaseEvents(): void {
  // ─── Article Created ──────────────────────────────────────────────────────
  eventBus.subscribe(
    "knowledge.article.created",
    async (data: { articleId: string; title: string; createdById: string }) => {
      logger.info(data, "[KB Events] knowledge.article.created received");
      try {
        await prisma.auditLog.create({
          data: {
            action: "KNOWLEDGE_ARTICLE_CREATED",
            targetTable: "knowledge_articles",
            targetId: data.articleId,
            newValue: { title: data.title },
            performedById: data.createdById,
          },
        });
      } catch (err) {
        logger.error(err, "[KB Events] Failed to write audit log for knowledge.article.created");
      }
    }
  );

  // ─── Article Updated ──────────────────────────────────────────────────────
  eventBus.subscribe(
    "knowledge.article.updated",
    async (data: { articleId: string; updatedById: string }) => {
      logger.info(data, "[KB Events] knowledge.article.updated received");
      try {
        await prisma.auditLog.create({
          data: {
            action: "KNOWLEDGE_ARTICLE_UPDATED",
            targetTable: "knowledge_articles",
            targetId: data.articleId,
            performedById: data.updatedById,
          },
        });
      } catch (err) {
        logger.error(err, "[KB Events] Failed to write audit log for knowledge.article.updated");
      }
    }
  );

  // ─── Article Published ────────────────────────────────────────────────────
  eventBus.subscribe(
    "knowledge.article.published",
    async (data: { articleId: string; publishedById: string }) => {
      logger.info(data, "[KB Events] knowledge.article.published received");
      try {
        await prisma.auditLog.create({
          data: {
            action: "KNOWLEDGE_ARTICLE_PUBLISHED",
            targetTable: "knowledge_articles",
            targetId: data.articleId,
            newValue: { status: "PUBLISHED" },
            performedById: data.publishedById,
          },
        });
      } catch (err) {
        logger.error(err, "[KB Events] Failed to write audit log for knowledge.article.published");
      }
    }
  );

  logger.info("[KB Events] Knowledge Base event handlers registered");
}

export { registerKnowledgeBaseEvents };
