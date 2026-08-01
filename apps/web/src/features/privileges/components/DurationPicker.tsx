import React, { useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { Input } from "../../../components/ui/input.js";
import {
  DURATION_PRESETS,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
} from "../schemas/index.js";

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
  /** Custom (non-preset) durations are reserved for System Administrators. */
  allowCustom?: boolean;
  /** Upper bound from the resolved approval policy, when known. */
  maxMinutes?: number;
  error?: string | undefined;
}

export function DurationPicker({
  value,
  onChange,
  allowCustom = false,
  maxMinutes = MAX_DURATION_MINUTES,
  error,
}: DurationPickerProps) {
  const isPreset = DURATION_PRESETS.some((p) => p.minutes === value);
  const [customMode, setCustomMode] = useState(!isPreset);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {DURATION_PRESETS.map((preset) => {
          const disabled = preset.minutes > maxMinutes;
          const active = !customMode && value === preset.minutes;
          return (
            <button
              key={preset.minutes}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                setCustomMode(false);
                onChange(preset.minutes);
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Clock className="size-3" />
              {preset.label}
            </button>
          );
        })}

        {allowCustom && (
          <button
            type="button"
            aria-pressed={customMode}
            onClick={() => setCustomMode(true)}
            className={cn(
              "rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
              customMode
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            Custom
          </button>
        )}
      </div>

      {allowCustom && customMode && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN_DURATION_MINUTES}
            max={MAX_DURATION_MINUTES}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-28"
            aria-label="Custom duration in minutes"
          />
          <span className="text-[11px] text-muted-foreground">
            minutes ({MIN_DURATION_MINUTES}–{MAX_DURATION_MINUTES})
          </span>
        </div>
      )}

      {error && <p className="text-[10px] font-semibold text-destructive">{error}</p>}
    </div>
  );
}
