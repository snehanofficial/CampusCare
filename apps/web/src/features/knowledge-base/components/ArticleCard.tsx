import React from "react";
import { Eye, ThumbsUp, ThumbsDown, Tag, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import type { KnowledgeArticle } from "../hooks/useKnowledgeBase.js";

interface ArticleCardProps {
  article: KnowledgeArticle;
  compact?: boolean;
}

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/knowledge-base/${article.slug}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      id={`kb-article-${article.id}`}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`group rounded-xl border border-border bg-card/60 backdrop-blur-sm
        cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5
        hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30
        ${compact ? "p-3" : "p-5"}
      `}
    >
      {/* Status badge for drafts */}
      {article.status === "DRAFT" && (
        <span className="mb-2 inline-block rounded bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
          Draft
        </span>
      )}

      {/* Category */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
          {article.category.name}
        </span>
      </div>

      {/* Title */}
      <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 ${compact ? "text-xs mb-1" : "text-sm mb-2"}`}>
        {article.title}
      </h3>

      {/* Summary */}
      {!compact && (
        <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Tags */}
      {article.tags.length > 0 && !compact && (
        <div className="mb-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {article.tags.length > 4 && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              +{article.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {article.viewCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3 w-3 text-emerald-400" />
          {article.helpfulCount}
        </span>
        {!compact && (
          <>
            <span className="flex items-center gap-1">
              <ThumbsDown className="h-3 w-3 text-rose-400" />
              {article.notHelpfulCount}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(article.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
