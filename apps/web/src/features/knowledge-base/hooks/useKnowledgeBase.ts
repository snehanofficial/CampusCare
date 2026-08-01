import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sdkRequest } from "../../../lib/api-sdk.js";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  categoryId: string;
  category: KnowledgeCategory;
  tags: string[];
  status: ArticleStatus;
  createdById: string;
  updatedById: string | null;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: ArticleAuthor;
  updatedBy?: ArticleAuthor | null;
}

export interface KnowledgeArticleListResponse {
  data: KnowledgeArticle[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ArticleListParams {
  categoryId?: string;
  status?: ArticleStatus;
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  tags: string[];
  status?: ArticleStatus;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {}

export interface FeedbackInput {
  helpful: boolean;
  comment?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const kbKeys = {
  all: ["knowledge-base"] as const,
  articles: (params?: ArticleListParams) => [...kbKeys.all, "list", params ?? {}] as const,
  article: (slug: string) => [...kbKeys.all, "detail", slug] as const,
  search: (query: string) => [...kbKeys.all, "search", query] as const,
  categories: () => [...kbKeys.all, "categories"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useArticles(params?: ArticleListParams) {
  return useQuery({
    queryKey: kbKeys.articles(params),
    queryFn: () =>
      sdkRequest<KnowledgeArticleListResponse>({
        method: "GET",
        url: "/knowledge-base",
        params,
      }),
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: kbKeys.article(slug),
    queryFn: () =>
      sdkRequest<KnowledgeArticle>({
        method: "GET",
        url: `/knowledge-base/${slug}`,
      }),
    enabled: !!slug,
  });
}

export function useSearchArticles(query: string) {
  return useQuery({
    queryKey: kbKeys.search(query),
    queryFn: () =>
      sdkRequest<KnowledgeArticle[]>({
        method: "GET",
        url: "/knowledge-base/search",
        params: { q: query },
      }),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: kbKeys.categories(),
    queryFn: () =>
      sdkRequest<KnowledgeCategory[]>({
        method: "GET",
        url: "/knowledge-base/categories",
      }),
    staleTime: 5 * 60_000,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleInput) =>
      sdkRequest<KnowledgeArticle>({ method: "POST", url: "/knowledge-base", data }),
    onSuccess: () => {
      toast.success("Article created successfully");
      qc.invalidateQueries({ queryKey: kbKeys.all });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to create article"),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleInput }) =>
      sdkRequest<KnowledgeArticle>({ method: "PATCH", url: `/knowledge-base/${id}`, data }),
    onSuccess: () => {
      toast.success("Article updated");
      qc.invalidateQueries({ queryKey: kbKeys.all });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to update article"),
  });
}

export function usePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sdkRequest<KnowledgeArticle>({ method: "PATCH", url: `/knowledge-base/${id}/publish` }),
    onSuccess: () => {
      toast.success("Article published successfully");
      qc.invalidateQueries({ queryKey: kbKeys.all });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to publish article"),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      sdkRequest<{ deleted: boolean }>({ method: "DELETE", url: `/knowledge-base/${id}` }),
    onSuccess: () => {
      toast.success("Article deleted");
      qc.invalidateQueries({ queryKey: kbKeys.all });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to delete article"),
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FeedbackInput }) =>
      sdkRequest({ method: "POST", url: `/knowledge-base/${id}/feedback`, data }),
    onSuccess: (_, variables) => {
      toast.success(variables.data.helpful ? "Thanks for the feedback! 👍" : "Feedback recorded.");
      qc.invalidateQueries({ queryKey: kbKeys.all });
    },
    onError: (err: any) => toast.error(err?.message ?? "Failed to submit feedback"),
  });
}
