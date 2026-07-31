import React from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "../ui/input.js";
import { Button } from "../ui/button.js";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown.js";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterToolbarProps {
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterOptions?: FilterOption[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function FilterToolbar({
  searchPlaceholder = "Search...",
  searchQuery,
  onSearchChange,
  filterOptions = [],
  activeFilters,
  onFilterChange,
  onClearFilters,
}: FilterToolbarProps) {
  const hasActiveFilters =
    searchQuery || Object.values(activeFilters).some((val) => val !== "");

  return (
    <div className="space-y-3 w-full bg-card p-4 rounded-lg border border-border/60 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs focus:ring-primary h-9 w-full bg-muted/20"
          />
        </div>

        {/* Filter Dropdowns */}
        {filterOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((opt) => (
              <DropdownMenu key={opt.key}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-9 flex items-center gap-1.5 cursor-pointer">
                    <Filter className="size-3.5 text-muted-foreground" />
                    <span>
                      {opt.label}: {activeFilters[opt.key] || "All"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onFilterChange(opt.key, "")} className="text-xs">
                    All {opt.label}s
                  </DropdownMenuItem>
                  {opt.options.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => onFilterChange(opt.key, item.value)}
                      className="text-xs"
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs h-9 text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground border select-none">
              Query: "{searchQuery}"
              <button
                onClick={() => onSearchChange("")}
                className="hover:text-foreground cursor-pointer focus:outline-none"
              >
                <X className="size-3" />
              </button>
            </span>
          )}

          {Object.entries(activeFilters).map(([key, val]) => {
            if (!val) return null;
            const filterLabel = filterOptions.find((o) => o.key === key)?.label || key;
            const itemLabel =
              filterOptions.find((o) => o.key === key)?.options.find((o) => o.value === val)?.label || val;

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground border select-none"
              >
                {filterLabel}: {itemLabel}
                <button
                  onClick={() => onFilterChange(key, "")}
                  className="hover:text-foreground cursor-pointer focus:outline-none"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default FilterToolbar;
