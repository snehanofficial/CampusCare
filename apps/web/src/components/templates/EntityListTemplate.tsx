import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "../common/PageHeader.js";
import { DataTable } from "../ui/data-table.js";
import { FilterToolbar, FilterOption } from "./FilterToolbar.js";
import { ActionToolbar, ActionItem } from "./ActionToolbar.js";
import { Card, CardContent } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { PageSkeleton } from "../feedback/PageSkeleton.js";
import { EmptyState } from "../feedback/EmptyState.js";

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

  // React Table states
  columnPinning?: any;
  onColumnPinningChange?: (pinning: any) => void;
  columnSizing?: any;
  onColumnSizingChange?: (sizing: any) => void;
  columnVisibility?: any;
  onColumnVisibilityChange?: (visibility: any) => void;
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
  columnPinning,
  onColumnPinningChange,
  columnSizing,
  onColumnSizingChange,
  columnVisibility,
  onColumnVisibilityChange,
}: EntityListTemplateProps<TData, TValue>) {
  const [debugState, setDebugState] = useState<"normal" | "loading" | "empty" | "error">("normal");

  const activeLoading = debugState === "loading" || loading;
  const activeError = debugState === "error" ? "Network connection lost to API service endpoint." : error;
  const activeData = debugState === "empty" ? [] : data;

  return (
    <div className="space-y-4">
      {/* Header with state simulator for inspection */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border pb-3">
        <PageHeader title={title} description={description} />

        <div className="flex items-center gap-1 p-1 rounded-sm bg-surface-subtle border border-border self-start">
          <span className="text-[9px] font-extrabold text-muted-foreground uppercase px-1.5">State:</span>
          {(["normal", "loading", "empty", "error"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setDebugState(s)}
              className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold uppercase transition-colors cursor-pointer focus:outline-none ${
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

      {/* Main View states */}
      {activeLoading && debugState === "loading" ? (
        <PageSkeleton />
      ) : activeError ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="size-8 text-destructive mb-2" />
            <h3 className="text-xs font-bold text-destructive">Failed to Load Records</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {activeError}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="xs"
                onClick={onRetry}
                className="mt-4 text-xs h-7 flex items-center gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <RefreshCw className="size-3" />
                Retry Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : debugState === "empty" || (activeData.length === 0 && !activeLoading) ? (
        <div className="space-y-3">
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
            description={`No items found matching the current search parameters. Adjust filters or create a new record.`}
            action={actions[0] ? { label: actions[0].label, onClick: actions[0].onClick } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
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

          <DataTable
            columns={columns}
            data={activeData}
            loading={activeLoading}
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={onPageChange}
            columnPinning={columnPinning}
            onColumnPinningChange={onColumnPinningChange}
            columnSizing={columnSizing}
            onColumnSizingChange={onColumnSizingChange}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />
        </div>
      )}
    </div>
  );
}
export default EntityListTemplate;
