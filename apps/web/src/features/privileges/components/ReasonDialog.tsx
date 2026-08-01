import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.js";
import { Textarea } from "../../../components/ui/textarea.js";
import { Button } from "../../../components/ui/button.js";

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  minLength?: number;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
}

/**
 * Replaces `window.prompt` for reason/note capture — some embedded webviews
 * (e.g. VS Code's browser preview) silently no-op native `prompt()`, so any
 * flow that depends on it (revoke, reject) would otherwise appear to do nothing.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  minLength = 5,
  loading = false,
  destructive = false,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const valid = trimmed.length >= minLength;

  const close = (nextOpen: boolean) => {
    if (!nextOpen) setReason("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-1.5">
          <Textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`Explain why (min ${minLength} characters)...`}
            rows={3}
          />
          {!valid && trimmed.length > 0 && (
            <p className="text-[10px] font-semibold text-destructive">
              At least {minLength} characters required.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            size="sm"
            disabled={!valid}
            loading={loading}
            onClick={() => {
              onConfirm(trimmed);
              close(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
