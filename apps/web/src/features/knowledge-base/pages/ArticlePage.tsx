import React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Eye,
  Tag,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useArticle, useArticles } from "../hooks/useKnowledgeBase.js";
import { ArticleCard } from "../components/ArticleCard.js";
import { FeedbackButtons } from "../components/FeedbackButtons.js";

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading, error } = useArticle(slug ?? "");

  // Fetch related articles from same category
  const { data: relatedData } = useArticles({
    categoryId: article?.categoryId,
    pageSize: 4,
  });

  const relatedArticles = (relatedData?.data ?? []).filter((a) => a.id !== article?.id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading article…</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Article not found</p>
        <button
          onClick={() => navigate("/knowledge-base")}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to Knowledge Base
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 p-6">
      {/* ─── Breadcrumb / Back ────────────────────────────────────────────────── */}
      <button
        id="kb-article-back"
        onClick={() => navigate("/knowledge-base")}
        className="flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
          text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Knowledge Base
      </button>

      {/* ─── Article Header ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm">
        {/* Category + Status */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {article.category.name}
          </span>
          {article.status === "DRAFT" && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400">
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold leading-tight text-foreground">{article.title}</h1>

        {/* Summary */}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
          {article.createdBy && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.createdBy.firstName} {article.createdBy.lastName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {new Date(article.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
          {article.updatedAt !== article.createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {new Date(article.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.viewCount.toLocaleString()} views
          </span>
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── Article Content ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm">
        <div
          id="kb-article-content"
          className="prose prose-sm prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5
            prose-code:text-[11px] prose-code:text-foreground
            prose-pre:bg-muted prose-pre:rounded-lg prose-pre:border prose-pre:border-border
            prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
            prose-li:text-muted-foreground prose-li:leading-relaxed
            prose-strong:text-foreground prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      {/* ─── Feedback ─────────────────────────────────────────────────────────── */}
      <FeedbackButtons articleId={article.id} />

      {/* ─── Related Articles ─────────────────────────────────────────────────── */}
      {relatedArticles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Related Articles</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel.id} article={rel} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ArticlePage;
