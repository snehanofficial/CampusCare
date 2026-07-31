import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "../common/PageHeader.js";
import { DataTable } from "../ui/data-table.js";
import { FilterToolbar, FilterOption } from "./FilterToolbar.js";
import { ActionToolbar, ActionItem } from "./ActionToolbar.js";
import { Card, CardContent } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { AlertCircle, RefreshCw } from "lucide-react";
import { PageSkeleton } from "../feedback/PageSkeleton.js";
import { EmptyState } from "../feedback/EmptyState.js";
import { Inbox } from "lucide-react";

interface EntityListTemplateProps<TData, TValue> {
  title: string;
  description?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterOptions?: FilterOption[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  actions?: ActionItem[];
  selectedCount?: number;
  bulkActions?: ActionItem[];
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}

export function EntityListTemplate<TData, TValue>({
  title,
  description,
  columns,
  data,
  loading = false,
  error = null,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  filterOptions = [],
  activeFilters,
  onFilterChange,
  onClearFilters,
  actions = [],
  selectedCount = 0,
  bulkActions = [],
  pageIndex = 1,
  pageSize = 10,
  pageCount = 1,
  onPageChange,
  onRetry,
}: EntityListTemplateProps<TData, TValue>) {
  // Debug review states
  const [debugState, setDebugState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const activeLoading = debugState === "loading" || loading;
  const activeError = debugState === "error" ? "Simulated API gateway error connection lost." : error;
  const activeData = debugState === "empty" ? [] : data;

  return (
    <div className="space-y-6">
      {/* Page Header & Interactive Demo State Switches */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <PageHeader title={title} description={description} />
        
        {/* Interactive reviewer dashboard */}
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-muted/40 border border-border/50 self-start">
          <span className="text-[10px] font-bold text-muted-foreground uppercase px-2">Demo:</span>
          {(["normal", "loading", "empty", "error"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setDebugState(s)}
              className={`px-2 py-1 rounded text-[9px] font-bold tracking-tight uppercase transition-colors cursor-pointer focus:outline-none ${
                debugState === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel views */}
      {activeLoading && debugState === "loading" ? (
        <PageSkeleton />
      ) : activeError ? (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="size-10 text-destructive mb-3" />
            <h3 className="text-sm font-bold text-destructive">Failed to fetch data</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {activeError}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-4 text-xs h-8 flex items-center gap-1 border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer"
              >
                <RefreshCw className="size-3" />
                Retry Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : debugState === "empty" || (activeData.length === 0 && !activeLoading) ? (
        <div className="space-y-4">
          <FilterToolbar
            searchPlaceholder={searchPlaceholder}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
          />
          <EmptyState
            icon={Inbox}
            title={`No ${title} Records Found`}
            description={`No items found matching the current search parameters. Create a new record or adjust your filter parameters.`}
            action={actions[0] ? { label: actions[0].label, onClick: actions[0].onClick } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters & Actions Panel */}
          <FilterToolbar
            searchPlaceholder={searchPlaceholder}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
          />

          <ActionToolbar
            selectedCount={selectedCount}
            bulkActions={bulkActions}
            actions={actions}
          />

          {/* Table Container */}
          <div className="w-full">
            <DataTable
              columns={columns}
              data={activeData}
              loading={activeLoading}
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default EntityListTemplate;
