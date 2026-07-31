import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in duration-200">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/65 text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs text-muted-foreground max-w-sm leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          <button
            onClick={action.onClick}
            className="rounded-md bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}
export default EmptyState;
