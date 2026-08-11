import React, { useState } from "react";
import { CRUDDialogTemplate } from "@/components/templates/CRUDDialogTemplate.js";
import { Input } from "@/components/ui/input.js";
import { Textarea } from "@/components/ui/textarea.js";
import { useSetUnavailability } from "../hooks/index.js";

interface SetUnavailabilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  technicianId: string;
  technicianName: string;
  /** Pre-fills the form when extending an existing unavailability window. */
  currentUnavailableUntil?: string | null;
}

/** Duration presets in minutes — same shape as privileges' DurationPicker. */
const PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "Rest of today (8h)", minutes: 480 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
];

function minutesFromNowIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function SetUnavailabilityDialog({
  isOpen,
  onClose,
  technicianId,
  technicianName,
  currentUnavailableUntil,
}: SetUnavailabilityDialogProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(240);
  const [customDateTime, setCustomDateTime] = useState("");
  const [reason, setReason] = useState("");
  const mutation = useSetUnavailability();

  const isExtend = Boolean(currentUnavailableUntil);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unavailableUntil = customDateTime
      ? new Date(customDateTime).toISOString()
      : selectedMinutes
        ? minutesFromNowIso(selectedMinutes)
        : null;

    if (!unavailableUntil) return;
    if (new Date(unavailableUntil).getTime() <= Date.now()) return;

    mutation.mutate(
      { technicianId, payload: { unavailableUntil, reason: reason.trim() || null } },
      {
        onSuccess: () => {
          onClose();
          setReason("");
          setCustomDateTime("");
        },
      },
    );
  };

  return (
    <CRUDDialogTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={isExtend ? `Extend unavailability — ${technicianName}` : `Mark unavailable — ${technicianName}`}
      description="Temporary and separate from the account's active/inactive status — this only affects new ticket assignment eligibility."
      onSubmit={handleSubmit}
      submitLabel={isExtend ? "Extend" : "Mark Unavailable"}
      isSubmitting={mutation.isPending}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Unavailable until</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                aria-pressed={!customDateTime && selectedMinutes === preset.minutes}
                onClick={() => {
                  setCustomDateTime("");
                  setSelectedMinutes(preset.minutes);
                }}
                className={`rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
                  !customDateTime && selectedMinutes === preset.minutes
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground">or a specific date/time:</span>
            <Input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => {
                setCustomDateTime(e.target.value);
                setSelectedMinutes(null);
              }}
              className="w-56 text-xs"
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Reason (optional)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. On leave, at a training session…"
            maxLength={300}
            className="text-xs"
            rows={2}
          />
        </div>
      </div>
    </CRUDDialogTemplate>
  );
}
export default SetUnavailabilityDialog;
