import React from "react";
import { cn } from "../../lib/utils.js";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive" | "info" | "outline";
}

export function Tag({ className, variant = "secondary", ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold select-none border border-transparent transition-colors",
        {
          "bg-primary/10 text-primary border-primary/20": variant === "primary",
          "bg-secondary text-secondary-foreground border-border/40": variant === "secondary",
          "bg-success/10 text-success border-success/20": variant === "success",
          "bg-warning/10 text-warning border-warning/20": variant === "warning",
          "bg-destructive/10 text-destructive border-destructive/20": variant === "destructive",
          "bg-info/10 text-info border-info/20": variant === "info",
          "border-border bg-background text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
