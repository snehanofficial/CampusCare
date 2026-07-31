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
  searchPlaceholder = "Search records...",
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
    <div className="space-y-2.5 w-full bg-card p-3 rounded-sm border border-border shadow-xs">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 text-xs h-8 w-full bg-background"
          />
        </div>

        {/* Filter Dropdowns */}
        {filterOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {filterOptions.map((opt) => (
              <DropdownMenu key={opt.key}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="xs" className="h-8 text-xs flex items-center gap-1.5 cursor-pointer">
                    <Filter className="size-3 text-muted-foreground" />
                    <span>
                      {opt.label}: <span className="font-bold">{activeFilters[opt.key] || "All"}</span>
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
                size="xs"
                onClick={onClearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-foreground border border-border select-none">
              Query: "{searchQuery}"
              <button
                onClick={() => onSearchChange("")}
                className="hover:text-destructive cursor-pointer focus:outline-none ml-1"
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
                className="inline-flex items-center gap-1 rounded-sm bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-foreground border border-border select-none"
              >
                {filterLabel}: {itemLabel}
                <button
                  onClick={() => onFilterChange(key, "")}
                  className="hover:text-destructive cursor-pointer focus:outline-none ml-1"
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
