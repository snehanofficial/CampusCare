import React from "react";
import { Timer } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { formatRemaining } from "../utils/index.js";

interface RemainingTimeProps {
  expiresAt: string | null;
  /** Timestamp from the single shared `useCountdown` ticker (one timer per table). */
  now: number;
}

export function RemainingTime({ expiresAt, now }: RemainingTimeProps) {
  const label = formatRemaining(expiresAt, now);
  const remainingMs = expiresAt ? new Date(expiresAt).getTime() - now : 0;
  const expired = remainingMs <= 0;
  const urgent = !expired && remainingMs <= 5 * 60_000;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums",
        expired && "text-muted-foreground",
        urgent && "text-warning",
        !expired && !urgent && "text-foreground",
      )}
    >
      <Timer className="size-3" />
      {label}
    </span>
  );
}
