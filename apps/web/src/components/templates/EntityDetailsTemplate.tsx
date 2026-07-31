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
  actions?: { label: string; onClick: () => void; variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" }[];
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
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="size-9 p-0 flex items-center justify-center cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <PageHeader title={title} description={subtitle} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {actions.map((act) => (
            <Button
              key={act.label}
              variant={act.variant || "outline"}
              size="sm"
              onClick={act.onClick}
              className="text-xs h-9 cursor-pointer"
            >
              {act.label}
            </Button>
          ))}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="text-xs h-9 flex items-center gap-1.5 cursor-pointer">
              <Edit className="size-3.5" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="text-xs h-9 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash className="size-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Key-Value details table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Properties</CardTitle>
              {statusBadge}
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-x-6 gap-y-4 grid-cols-1 sm:grid-cols-2">
                {fields.map((f, i) => (
                  <div
                    key={i}
                    className={`space-y-1 ${
                      f.span === 2 ? "sm:col-span-2" : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      {f.label}
                    </span>
                    <div className="text-xs font-semibold text-foreground break-words leading-relaxed bg-muted/20 p-2.5 rounded border border-border/20">
                      {f.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline Column */}
        <div className="space-y-6">
          <Card className="border border-border bg-card h-fit">
            <CardHeader className="border-b border-border/40 py-4 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">History Log</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ActivityTimeline items={activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default EntityDetailsTemplate;
