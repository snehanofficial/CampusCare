import { DURATION_PRESETS } from "../schemas/index.js";
import type { ApprovalLevel, GrantStatus, RequestStatus } from "../types/index.js";

/** Human label for a duration in minutes ("2h 30m", "45m", "1d"). */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes <= 0) return "—";
  const preset = DURATION_PRESETS.find((p) => p.minutes === minutes);
  if (preset) return preset.label;

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", mins ? `${mins}m` : ""]
    .filter(Boolean)
    .join(" ");
}

/** Countdown label from now until an ISO timestamp. Returns "Expired" once past. */
export function formatRemaining(expiresAt: string | null, now: number = Date.now()): string {
  if (!expiresAt) return "—";
  const diffMs = new Date(expiresAt).getTime() - now;
  if (diffMs <= 0) return "Expired";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/** True when a grant expires inside the warning window. */
export function isExpiringSoon(expiresAt: string | null, windowMinutes = 5): boolean {
  if (!expiresAt) return false;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return diffMs > 0 && diffMs <= windowMinutes * 60_000;
}

type TagVariant = "primary" | "secondary" | "success" | "warning" | "destructive";

export function requestStatusVariant(status: RequestStatus): TagVariant {
  switch (status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function grantStatusVariant(status: GrantStatus): TagVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "REVOKED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function approvalLevelVariant(level: ApprovalLevel | null): TagVariant {
  switch (level) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "primary";
    default:
      return "secondary";
  }
}

/** Triggers a browser download for a CSV blob without leaking the object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
