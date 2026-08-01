import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { Skeleton } from "./skeleton.js";
import { Pagination } from "./pagination.js";
import { Inbox, Pin, PinOff } from "lucide-react";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  
  // Resizing, Pinning & Visibility states
  columnPinning?: ColumnPinningState;
  onColumnPinningChange?: (pinning: ColumnPinningState) => void;
  columnSizing?: ColumnSizingState;
  onColumnSizingChange?: (sizing: ColumnSizingState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  pageIndex = 1,
  pageSize = 10,
  pageCount = 1,
  onPageChange,
  emptyMessage = "No records found.",
  onRowClick,
  columnPinning,
  onColumnPinningChange,
  columnSizing,
  onColumnSizingChange,
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    columnResizeMode: "onChange",
    state: {
      columnPinning: columnPinning || { left: [], right: [] },
      columnSizing: columnSizing || {},
      columnVisibility: columnVisibility || {},
    },
    onColumnPinningChange: onColumnPinningChange ? (updater) => {
      if (typeof updater === "function") {
        onColumnPinningChange(updater(columnPinning || { left: [], right: [] }));
      } else {
        onColumnPinningChange(updater);
      }
    } : undefined,
    onColumnSizingChange: onColumnSizingChange ? (updater) => {
      if (typeof updater === "function") {
        onColumnSizingChange(updater(columnSizing || {}));
      } else {
        onColumnSizingChange(updater);
      }
    } : undefined,
    onColumnVisibilityChange: onColumnVisibilityChange ? (updater) => {
      if (typeof updater === "function") {
        onColumnVisibilityChange(updater(columnVisibility || {}));
      } else {
        onColumnVisibilityChange(updater);
      }
    } : undefined,
  });

  return (
    <div className="space-y-3 w-full">
      <div className="rounded-sm bg-card">
        <Table style={{ width: table.getCenterTotalSize(), minWidth: "100%" }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned();
                  const pinLeft = isPinned === "left" ? header.column.getStart("left") : undefined;
                  
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: isPinned ? "sticky" : "relative",
                        left: pinLeft !== undefined ? `${pinLeft}px` : undefined,
                        zIndex: isPinned ? 2 : 1,
                        backgroundColor: isPinned ? "rgba(24, 24, 27, 0.95)" : undefined,
                      }}
                      className="group relative select-none"
                    >
                      <div className="flex items-center justify-between gap-2 pr-4">
                        <span className="truncate">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        
                        {/* Pin / Unpin Action */}
                        {onColumnPinningChange && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              header.column.pin(isPinned ? false : "left");
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-indigo-400 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded bg-zinc-800"
                          >
                            {isPinned ? (
                              <PinOff className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <Pin className="h-3 w-3 text-zinc-400" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Resizer Handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none bg-zinc-700/50 hover:bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all ${
                            header.column.getIsResizing() ? "bg-indigo-500 opacity-100" : ""
                          }`}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer hover:bg-zinc-800/40" : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned();
                    const pinLeft = isPinned === "left" ? cell.column.getStart("left") : undefined;

                    return (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          position: isPinned ? "sticky" : "relative",
                          left: pinLeft !== undefined ? `${pinLeft}px` : undefined,
                          zIndex: isPinned ? 1 : 0,
                          backgroundColor: isPinned ? "rgba(9, 9, 11, 0.95)" : undefined,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                    <Inbox className="size-6 text-muted-foreground/60" />
                    <span className="text-xs font-semibold">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && pageCount > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] text-muted-foreground select-none font-medium">
            Page <span className="font-bold text-foreground">{pageIndex}</span> of{" "}
            <span className="font-bold text-foreground">{pageCount}</span>
          </div>
          <Pagination
            currentPage={pageIndex}
            totalPages={pageCount}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
export default DataTable;
