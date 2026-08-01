import React from "react";
import { Layers } from "lucide-react";
import type { KnowledgeCategory } from "../hooks/useKnowledgeBase.js";

interface CategoryFilterProps {
  categories: KnowledgeCategory[];
  selectedCategoryId: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
  isLoading?: boolean;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelect, isLoading }: CategoryFilterProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 shrink-0 animate-pulse rounded-full bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {/* "All" chip */}
      <button
        id="kb-category-all"
        onClick={() => onSelect(undefined)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold
          transition-all duration-150 whitespace-nowrap
          ${!selectedCategoryId
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
      >
        <Layers className="h-3 w-3" />
        All Topics
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          id={`kb-category-${cat.id}`}
          onClick={() => onSelect(selectedCategoryId === cat.id ? undefined : cat.id)}
          title={cat.description ?? cat.name}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold
            transition-all duration-150 whitespace-nowrap
            ${selectedCategoryId === cat.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
