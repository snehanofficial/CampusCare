/** Countdown label from now until an ISO timestamp. Mirrors features/privileges/utils's formatRemaining. */
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

/**
 * Availability state as the backend actually models it: deliberately three
 * distinct states, never conflating account inactivity with temporary
 * unavailability (per the explicit backend design in TECH-001).
 */
export type AvailabilityState = "AVAILABLE" | "TEMPORARILY_UNAVAILABLE" | "INACTIVE";

export function resolveAvailabilityState(params: {
  isActive: boolean;
  isManuallyUnavailable: boolean;
  unavailableUntil: string | null;
  now?: number;
}): AvailabilityState {
  if (!params.isActive) return "INACTIVE";
  const now = params.now ?? Date.now();
  const stillWithinWindow = params.unavailableUntil
    ? new Date(params.unavailableUntil).getTime() > now
    : false;
  if (params.isManuallyUnavailable && stillWithinWindow) return "TEMPORARILY_UNAVAILABLE";
  return "AVAILABLE";
}
