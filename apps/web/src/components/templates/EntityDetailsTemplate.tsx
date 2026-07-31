import React from "react";
import { PageHeader } from "../common/PageHeader.js";
import { Button } from "../ui/button.js";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card.js";
import { ActivityTimeline, TimelineItem } from "./ActivityTimeline.js";
import { ArrowLeft, Edit, Trash } from "lucide-react";

export interface DetailField {
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}

interface EntityDetailsTemplateProps {
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  fields: DetailField[];
  activities?: TimelineItem[];
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: { label: string; onClick: () => void; variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" }[];
}

export function EntityDetailsTemplate({
  title,
  subtitle,
  statusBadge,
  fields,
  activities = [],
  onBack,
  onEdit,
  onDelete,
  actions = [],
}: EntityDetailsTemplateProps) {
  return (
    <div className="space-y-4">
      {/* Header and Back Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <Button
              variant="outline"
              size="xs"
              onClick={onBack}
              className="size-8 p-0 flex items-center justify-center cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-3.5" />
            </Button>
          )}
          <div>
            <PageHeader title={title} description={subtitle} badge={statusBadge} />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {actions.map((act) => (
            <Button
              key={act.label}
              variant={act.variant || "outline"}
              size="xs"
              onClick={act.onClick}
              className="h-8 text-xs cursor-pointer"
            >
              {act.label}
            </Button>
          ))}
          {onEdit && (
            <Button variant="outline" size="xs" onClick={onEdit} className="h-8 text-xs flex items-center gap-1.5 cursor-pointer">
              <Edit className="size-3.5" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="xs"
              onClick={onDelete}
              className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash className="size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Properties Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle>Entity Specifications & Attributes</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-x-4 gap-y-3 grid-cols-1 sm:grid-cols-2">
                {fields.map((f, i) => (
                  <div
                    key={i}
                    className={`space-y-0.5 ${
                      f.span === 2 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase select-none">
                      {f.label}
                    </span>
                    <div className="text-xs font-semibold text-foreground break-words leading-relaxed bg-surface-subtle/50 p-2 rounded-sm border border-border/40">
                      {f.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Column */}
        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader className="py-3 px-4">
              <CardTitle>Audit & Change History</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline items={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default EntityDetailsTemplate;
