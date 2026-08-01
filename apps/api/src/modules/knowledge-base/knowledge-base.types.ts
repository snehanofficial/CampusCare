// ─── Knowledge Base Types ─────────────────────────────────────────────────────

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface KnowledgeCategoryData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArticleData {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  categoryId: string;
  category: KnowledgeCategoryData;
  tags: string[];
  status: ArticleStatus;
  createdById: string;
  updatedById: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { id: string; firstName: string; lastName: string };
  updatedBy?: { id: string; firstName: string; lastName: string } | null;
  feedbacks?: ArticleFeedbackData[];
  helpfulCount?: number;
  notHelpfulCount?: number;
}

export interface ArticleFeedbackData {
  id: string;
  articleId: string;
  userId: string;
  helpful: boolean;
  comment: string | null;
  createdAt: Date;
}

export interface ArticleListParams {
  categoryId?: string;
  status?: ArticleStatus;
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  includeAll?: boolean; // admin: include drafts
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  tags: string[];
  status?: ArticleStatus;
}

export interface ArticleUpdateInput {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: string;
  tags?: string[];
  status?: ArticleStatus;
}

export interface FeedbackInput {
  helpful: boolean;
  comment?: string;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  tags: string[];
  viewCount: number;
  relevanceScore: number; // 1=title match, 2=tag match, 3=content match
}
