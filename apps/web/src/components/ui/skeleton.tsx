import { cn } from "../../lib/utils.js";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded bg-muted/65", className)} {...props} />;
}
