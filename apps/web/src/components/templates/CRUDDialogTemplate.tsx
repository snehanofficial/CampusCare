import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog.js";
import { Button } from "../ui/button.js";
import { LoadingSpinner } from "../ui/loading-spinner.js";

interface CRUDDialogTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function CRUDDialogTemplate({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  isSubmitting = false,
  children,
  size = "md",
}: CRUDDialogTemplateProps) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="py-2 space-y-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9 cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 min-w-24 cursor-pointer"
            >
              {isSubmitting ? <LoadingSpinner size="sm" className="mr-1" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default CRUDDialogTemplate;
