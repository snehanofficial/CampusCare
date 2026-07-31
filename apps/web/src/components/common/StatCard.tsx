import { LucideIcon } from "lucide-react";

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
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-pulse">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="mt-2 h-8 w-2/3 rounded bg-muted" />
        <div className="mt-1 h-3 w-1/2 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {delta && (
          <p className="text-xs">
            <span
              className={delta.isPositive ? "text-success font-medium" : "text-destructive font-medium"}
            >
              {delta.isPositive ? "+" : ""}{delta.value}%
            </span>{" "}
            <span className="text-muted-foreground">vs last week</span>
          </p>
        )}
      </div>
      {Icon && (
        <div className="rounded-md bg-muted/40 p-2 text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
    </div>
  );
}
