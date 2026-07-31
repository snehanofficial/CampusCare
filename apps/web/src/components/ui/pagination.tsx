import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "./button.js";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis-1");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis-2");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className={cn("flex items-center justify-center space-x-1.5", className)} aria-label="Pagination Navigation">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous Page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {renderPages().map((page, idx) => {
        if (typeof page === "string") {
          return (
            <span key={idx} className="flex size-9 items-center justify-center text-muted-foreground" aria-hidden="true">
              <MoreHorizontal className="size-4" />
            </span>
          );
        }

        return (
          <Button
            key={idx}
            variant={page === currentPage ? "primary" : "outline"}
            className="w-9 h-9 p-0"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
