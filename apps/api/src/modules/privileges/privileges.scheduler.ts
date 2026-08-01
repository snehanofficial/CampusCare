import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../../utils/logger.js";
import { PrivilegesRepository } from "./privileges.repository.js";
import { GTPE_ACTIONS, notify, writeAudit } from "./privileges.events.js";
import { invalidateHydrationCache } from "./privileges.middleware.js";

/** Warn holders this many minutes before a grant expires. */
const EXPIRING_SOON_WINDOW_MINUTES = 5;
/** Pending requests older than this are auto-expired without review. */
const STALE_REQUEST_HOURS = 24;

let task: ScheduledTask | null = null;
/** Guards against overlapping ticks when a sweep runs longer than the interval. */
let isRunning = false;

// ─── (A) Expire grants whose time is up ────────────────────────────────────────
async function sweepExpiredGrants(now: Date): Promise<void> {
  const expired = await PrivilegesRepository.findExpiredGrants(now);
  if (expired.length === 0) return;

  await PrivilegesRepository.markGrantsExpired(
    expired.map((g) => g.id),
    now,
  );

  for (const grant of expired) {
    invalidateHydrationCache(grant.userId);
    await writeAudit({
      action: GTPE_ACTIONS.EXPIRE,
      targetTable: "user_permissions",
      targetId: grant.id,
      oldValue: { status: "ACTIVE", expiresAt: grant.expiresAt },
      newValue: { status: "EXPIRED" },
      // Automatic expiry is attributed to the original granter for traceability.
      performedById: grant.grantedById ?? grant.userId,
    });
  }

  await notify({
    userIds: [...new Set(expired.map((g) => g.userId))],
    title: "Temporary access expired",
    message: `${expired.length} of your temporary permission(s) have expired.`,
    type: "INFO",
  });

  logger.info({ count: expired.length }, "GTPE scheduler: expired temporary grants");
}

// ─── (B) Warn holders about imminent expiry ────────────────────────────────────
async function sweepExpiringSoon(now: Date): Promise<void> {
  const until = new Date(now.getTime() + EXPIRING_SOON_WINDOW_MINUTES * 60_000);
  const expiring = await PrivilegesRepository.findExpiringSoonGrants(now, until);
  if (expiring.length === 0) return;

  await PrivilegesRepository.markGrantsNotified(expiring.map((g) => g.id));

  await notify({
    userIds: [...new Set(expiring.map((g) => g.userId))],
    title: "Temporary access expiring soon",
    message: `${expiring.length} of your temporary permission(s) expire within ${EXPIRING_SOON_WINDOW_MINUTES} minutes.`,
    type: "WARNING",
  });

  logger.info({ count: expiring.length }, "GTPE scheduler: expiring-soon warnings sent");
}

// ─── (C) Expire pending requests nobody reviewed ───────────────────────────────
async function sweepStaleRequests(now: Date): Promise<void> {
  const before = new Date(now.getTime() - STALE_REQUEST_HOURS * 3_600_000);
  const stale = await PrivilegesRepository.findStaleRequests(before);
  if (stale.length === 0) return;

  await PrivilegesRepository.markRequestsExpired(stale.map((r) => r.id));

  for (const request of stale) {
    await writeAudit({
      action: GTPE_ACTIONS.EXPIRE,
      targetTable: "temporary_permission_requests",
      targetId: request.id,
      oldValue: { status: "PENDING" },
      newValue: { status: "EXPIRED", reason: "No review within 24 hours" },
      performedById: request.requesterId,
    });
  }

  await notify({
    userIds: [...new Set(stale.map((r) => r.requesterId))],
    title: "Temporary access request expired",
    message: `Your request expired after ${STALE_REQUEST_HOURS} hours without review. Please resubmit if still needed.`,
    type: "WARNING",
  });

  logger.info({ count: stale.length }, "GTPE scheduler: expired stale requests");
}

/**
 * One scheduler tick. Wrapped so a failure in any sweep is logged and swallowed —
 * the cron job must never be able to crash the API process.
 */
export async function runPrivilegeSweep(): Promise<void> {
  if (isRunning) {
    logger.debug("GTPE scheduler: previous tick still running, skipping");
    return;
  }
  isRunning = true;
  const now = new Date();
  try {
    await sweepExpiredGrants(now);
    await sweepExpiringSoon(now);
    await sweepStaleRequests(now);
  } catch (err) {
    logger.error(err instanceof Error ? err : { err }, "GTPE scheduler tick failed");
  } finally {
    isRunning = false;
  }
}

/** Starts the every-minute sweep. No-op when ENABLE_SCHEDULER is explicitly "false". */
export function startPrivilegeScheduler(): void {
  if (process.env.ENABLE_SCHEDULER === "false") {
    logger.info("GTPE scheduler disabled via ENABLE_SCHEDULER=false");
    return;
  }
  if (task) return;
  task = cron.schedule("*/1 * * * *", () => {
    void runPrivilegeSweep();
  });
  logger.info("⏱️  GTPE privilege scheduler started (every 1 minute)");
}

export function stopPrivilegeScheduler(): void {
  if (!task) return;
  void task.stop();
  task = null;
  logger.info("GTPE privilege scheduler stopped");
}
