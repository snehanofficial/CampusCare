import React from "react";
import { LayoutTemplate } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { useTemplates } from "../hooks/index.js";
import { formatDuration } from "../utils/index.js";
import type { PermissionTemplate } from "../types/index.js";

interface TemplatePickerProps {
  selectedTemplateId: string | null;
  /** Pre-fills the form; the selection stays fully editable afterwards. */
  onApply: (template: PermissionTemplate | null) => void;
  enabled?: boolean;
}

export function TemplatePicker({
  selectedTemplateId,
  onApply,
  enabled = true,
}: TemplatePickerProps) {
  const { data: templates, isLoading } = useTemplates(enabled);

  if (isLoading) {
    return <p className="text-[11px] text-muted-foreground">Loading templates...</p>;
  }
  if (!templates || templates.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        No permission templates configured yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {templates.map((template) => {
        const active = template.id === selectedTemplateId;
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={active}
            title={template.description ?? undefined}
            onClick={() => onApply(active ? null : template)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutTemplate className="size-3" />
            {template.name}
            <span className="font-normal opacity-70">
              ({template.items.length} · {formatDuration(template.defaultDurationMinutes)})
            </span>
          </button>
        );
      })}
    </div>
  );
}
