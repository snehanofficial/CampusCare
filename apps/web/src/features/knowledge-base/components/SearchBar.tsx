import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useSearchArticles } from "../hooks/useKnowledgeBase.js";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showDropdown?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchBar({ placeholder = "Search articles, topics, tags…", onSearch, showDropdown = true }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useSearchArticles(debouncedQuery);

  const showResults = showDropdown && isFocused && debouncedQuery.trim().length >= 2;

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  }, [onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    setIsFocused(false);
  };

  const handleResultClick = (slug: string) => {
    navigate(`/knowledge-base/${slug}`);
    setQuery("");
    setIsFocused(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200
            ${isFocused ? "border-primary/60 shadow-lg shadow-primary/10 bg-card" : "border-border bg-card/60"}`}
        >
          {isLoading && debouncedQuery.length >= 2 ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            id="kb-search-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60
              focus:outline-none"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground
              hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Dropdown results */}
      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-border
          bg-card shadow-xl shadow-black/20 overflow-hidden">
          {results && results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto divide-y divide-border">
              {results.map((article) => (
                <li key={article.id}>
                  <button
                    onClick={() => handleResultClick(article.slug)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{article.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{article.summary}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">
                        {article.category.name}
                      </span>
                      {article.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[9px] text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No articles found for "{debouncedQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
