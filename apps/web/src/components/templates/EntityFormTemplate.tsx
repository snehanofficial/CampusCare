import React from "react";
import { PageHeader } from "../common/PageHeader.js";
import { Button } from "../ui/button.js";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card.js";
import { LoadingSpinner } from "../ui/loading-spinner.js";
import { ArrowLeft } from "lucide-react";

interface EntityFormTemplateProps {
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: React.ReactNode;
}

export function EntityFormTemplate({
  title,
  description,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  children,
}: EntityFormTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="size-9 p-0 flex items-center justify-center cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <PageHeader title={title} description={description} />
          </div>
        </div>
      </div>

      {/* Form Container */}
      <Card className="border border-border bg-card max-w-2xl mx-auto">
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fill in details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">{children}</div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-xs h-9 cursor-pointer"
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs h-9 min-w-28 cursor-pointer"
              >
                {isSubmitting ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
                {submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default EntityFormTemplate;
