import React, { useState } from "react";
import { Plus, TrendingUp, Clock, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { SearchBar } from "../components/SearchBar.js";
import { CategoryFilter } from "../components/CategoryFilter.js";
import { ArticleCard } from "../components/ArticleCard.js";
import { useArticles, useCategories } from "../hooks/useKnowledgeBase.js";
import { useNavigate } from "react-router";

export function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: loadingCategories } = useCategories();

  // Popular articles (sorted by views)
  const { data: popularData, isLoading: loadingPopular } = useArticles({
    categoryId: selectedCategoryId,
    search: searchQuery || undefined,
    pageSize: 6,
    page: 1,
  });

  // Recent articles (sorted differently — we'll use another query for recents)
  const { data: recentData, isLoading: loadingRecent, error } = useArticles({
    categoryId: selectedCategoryId,
    search: searchQuery || undefined,
    pageSize: 8,
    page: 1,
  });

  // Check admin permission from stored auth
  const userPermissions = (() => {
    try {
      const raw = sessionStorage.getItem("campuscare_permissions") ?? localStorage.getItem("campuscare_permissions");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  })();
  const canManage = userPermissions.includes("knowledge-base:manage");

  const popularArticles = popularData?.data ?? [];
  const recentArticles = recentData?.data ?? [];
  const hasResults = popularArticles.length > 0 || recentArticles.length > 0;

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      {/* ─── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 px-8 py-10">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Knowledge Base
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Find answers before submitting a ticket
          </h1>
          <p className="mb-6 max-w-xl text-sm text-muted-foreground">
            Browse our self-service library of IT guides, troubleshooting steps, and campus procedures.
          </p>
          <div className="max-w-xl">
            <SearchBar
              placeholder="Search — e.g. 'WiFi not connecting', 'password reset'…"
              onSearch={setSearchQuery}
              showDropdown={true}
            />
          </div>
        </div>

        {/* Decorative background */}
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-24 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* ─── Admin Actions ────────────────────────────────────────────────────── */}
      {canManage && (
        <div className="flex items-center justify-end">
          <button
            id="kb-create-article-btn"
            onClick={() => navigate("/knowledge-base/new")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold
              text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Article
          </button>
        </div>
      )}

      {/* ─── Category Filter ──────────────────────────────────────────────────── */}
      <CategoryFilter
        categories={categories ?? []}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        isLoading={loadingCategories}
      />

      {/* ─── Error State ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <p className="text-sm text-rose-400">Failed to load articles. Please try again.</p>
        </div>
      )}

      {/* ─── Loading State ────────────────────────────────────────────────────── */}
      {(loadingPopular || loadingRecent) && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Loading articles…</span>
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────────────────── */}
      {!loadingPopular && !loadingRecent && !hasResults && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No articles found</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            {searchQuery
              ? `No results for "${searchQuery}" — try different keywords`
              : selectedCategoryId
              ? "No published articles in this category yet"
              : "No published articles available yet"}
          </p>
        </div>
      )}

      {/* ─── Popular Articles ─────────────────────────────────────────────────── */}
      {!loadingPopular && popularArticles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {searchQuery ? "Search Results" : "Popular Articles"}
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {popularData?.total ?? 0} total
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Recent Articles ──────────────────────────────────────────────────── */}
      {!searchQuery && !loadingRecent && recentArticles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recently Updated</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentArticles.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default KnowledgeBasePage;
