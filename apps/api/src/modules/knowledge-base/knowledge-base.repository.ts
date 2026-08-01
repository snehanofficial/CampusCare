import { prisma } from "../../database/prisma.js";
import type { ArticleListParams, ArticleCreateInput, ArticleUpdateInput, FeedbackInput } from "./knowledge-base.types.js";

// ─── Article Include Config ───────────────────────────────────────────────────

const articleInclude = {
  category: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  updatedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  feedbacks: {
    select: { helpful: true },
  },
} as const;

// ─── Category Queries ─────────────────────────────────────────────────────────

export async function findCategories() {
  return prisma.knowledgeCategory.findMany({
    orderBy: { name: "asc" },
  });
}

export async function findCategoryById(id: string) {
  return prisma.knowledgeCategory.findUnique({ where: { id } });
}

export async function createCategory(data: { name: string; description?: string }) {
  return prisma.knowledgeCategory.create({ data });
}

// ─── Article Queries ──────────────────────────────────────────────────────────

export async function findArticles(params: ArticleListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  // Non-admin always sees only PUBLISHED
  if (!params.includeAll) {
    where.status = "PUBLISHED";
  } else if (params.status) {
    where.status = params.status;
  }

  if (params.categoryId) where.categoryId = params.categoryId;

  if (params.tag) {
    where.tags = { has: params.tag };
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      include: articleInclude,
      orderBy: { viewCount: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);

  return {
    data: articles.map(enrichWithFeedbackCounts),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function findArticleBySlug(slug: string) {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { slug },
    include: articleInclude,
  });
  if (!article) return null;

  // Increment view count asynchronously (fire & forget)
  prisma.knowledgeArticle
    .update({ where: { slug }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return enrichWithFeedbackCounts(article);
}

export async function findArticleById(id: string) {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: articleInclude,
  });
  return article ? enrichWithFeedbackCounts(article) : null;
}

export async function createArticle(data: ArticleCreateInput & { createdById: string; slug: string }) {
  return prisma.knowledgeArticle.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      summary: data.summary,
      categoryId: data.categoryId,
      tags: data.tags,
      status: data.status ?? "DRAFT",
      createdById: data.createdById,
    },
    include: articleInclude,
  });
}

export async function updateArticle(id: string, data: ArticleUpdateInput & { updatedById: string }) {
  return prisma.knowledgeArticle.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedById: data.updatedById,
    },
    include: articleInclude,
  });
}

export async function deleteArticle(id: string) {
  return prisma.knowledgeArticle.delete({ where: { id } });
}

export async function findSlugExists(slug: string) {
  const count = await prisma.knowledgeArticle.count({ where: { slug } });
  return count > 0;
}

// ─── Deterministic Search ─────────────────────────────────────────────────────

export async function searchArticles(query: string): Promise<ReturnType<typeof enrichWithFeedbackCounts>[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    },
    include: articleInclude,
    orderBy: { viewCount: "desc" },
    take: 20,
  });

  // Score and sort: title match = 1st, tag match = 2nd, content match = 3rd
  return articles
    .map((a) => {
      let score = 3;
      if (a.title.toLowerCase().includes(q)) score = 1;
      else if (a.tags.some((t) => t.toLowerCase().includes(q))) score = 2;
      return { ...enrichWithFeedbackCounts(a), relevanceScore: score };
    })
    .sort((a, b) => a.relevanceScore - b.relevanceScore);
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export async function upsertFeedback(articleId: string, userId: string, data: FeedbackInput) {
  return prisma.articleFeedback.upsert({
    where: { articleId_userId: { articleId, userId } },
    update: {
      helpful: data.helpful,
      comment: data.comment ?? null,
    },
    create: {
      articleId,
      userId,
      helpful: data.helpful,
      comment: data.comment ?? null,
    },
  });
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function enrichWithFeedbackCounts<T extends { feedbacks: { helpful: boolean }[] }>(article: T) {
  const helpfulCount = article.feedbacks.filter((f) => f.helpful).length;
  const notHelpfulCount = article.feedbacks.filter((f) => !f.helpful).length;
  return { ...article, helpfulCount, notHelpfulCount };
}
