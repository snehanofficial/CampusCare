import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { useCountdown, useEffectivePrivileges } from "../hooks/index.js";
import { formatRemaining } from "../utils/index.js";

/**
 * Navbar badge showing the caller's live temporary privileges.
 *
 * Self-hiding by design: it renders `null` whenever the user holds no active
 * grants (and on any error), so the navbar is visually unchanged for the vast
 * majority of sessions. This is the sole reason Navbar.tsx is touched at all.
 */
export function TemporaryAccessIndicator() {
  const { data, isError } = useEffectivePrivileges(true);
  const hasAccess = Boolean(data?.hasTemporaryAccess);
  const now = useCountdown(hasAccess);

  if (isError || !data || !hasAccess) return null;

  const remainingMs = data.soonestExpiresAt
    ? new Date(data.soonestExpiresAt).getTime() - now
    : 0;
  const urgent = remainingMs > 0 && remainingMs <= 5 * 60_000;

  return (
    <div
      role="status"
      aria-live="polite"
      title={data.permissions.map((p) => p.displayName).join(", ")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-semibold transition-colors",
        urgent
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      <ShieldCheck className="size-3" />
      <span className="hidden sm:inline">Temporary access</span>
      <span className="font-mono tabular-nums">
        {formatRemaining(data.soonestExpiresAt, now)}
      </span>
      {data.count > 1 && (
        <span className="rounded-full bg-current/20 px-1 tabular-nums">{data.count}</span>
      )}
    </div>
  );
}
