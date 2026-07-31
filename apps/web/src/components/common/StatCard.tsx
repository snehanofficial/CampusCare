import { LucideIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton.js";

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
}

export function StatCard({ title, value, delta, description, icon: Icon, loading = false }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-sm border border-border bg-card p-3 shadow-xs animate-pulse">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-6 w-2/3" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-card p-3.5 shadow-xs flex justify-between items-start transition-colors">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
          {title}
        </p>
        <p className="text-xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </p>
        {description && (
          <p className="text-[11px] text-muted-foreground">
            {description}
          </p>
        )}
        {delta && (
          <p className="text-[11px] font-medium">
            <span
              className={delta.isPositive ? "text-success font-bold" : "text-destructive font-bold"}
            >
              {delta.isPositive ? "+" : ""}{delta.value}%
            </span>{" "}
            <span className="text-muted-foreground">vs prev period</span>
          </p>
        )}
      </div>
      {Icon && (
        <div className="rounded-sm bg-surface-subtle p-2 text-muted-foreground border border-border/40">
          <Icon className="size-4" />
        </div>
      )}
    </div>
  );
}
export default StatCard;
