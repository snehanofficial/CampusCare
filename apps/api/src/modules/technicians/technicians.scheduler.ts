import cron, { type ScheduledTask } from "node-cron";
import { logger } from "../../utils/logger.js";
import { TechniciansService } from "./technicians.service.js";

let task: ScheduledTask | null = null;
let isRunning = false;

/**
 * One sweep: clears any technician's temporary unavailability whose window has
 * passed. Mirrors privileges.scheduler.ts's structure (same audited, working
 * pattern for this exact "expire something past its timestamp" shape).
 */
export async function runTechnicianAvailabilitySweep(): Promise<void> {
  if (isRunning) {
    logger.debug("Technician availability scheduler: previous tick still running, skipping");
    return;
  }
  isRunning = true;
  try {
    const count = await TechniciansService.expireStaleUnavailability(new Date());
    if (count > 0) {
      logger.info({ count }, "Technician availability scheduler: cleared expired unavailability");
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : { err }, "Technician availability scheduler tick failed");
  } finally {
    isRunning = false;
  }
}

export function startTechnicianAvailabilityScheduler(): void {
  if (process.env.ENABLE_SCHEDULER === "false") {
    logger.info("Technician availability scheduler disabled via ENABLE_SCHEDULER=false");
    return;
  }
  if (task) return;
  task = cron.schedule("*/1 * * * *", () => {
    void runTechnicianAvailabilitySweep();
  });
  logger.info("⏱️  Technician availability scheduler started (every 1 minute)");
}

export function stopTechnicianAvailabilityScheduler(): void {
  if (!task) return;
  void task.stop();
  task = null;
  logger.info("Technician availability scheduler stopped");
}
