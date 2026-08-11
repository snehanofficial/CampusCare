import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

/**
 * Audit + notification writers for the technicians module.
 * Follows the same repo-wide convention as privileges.events.ts (no shared
 * audit/notification service exists) — best-effort, never blocks the caller.
 */

export const TECH_ACTIONS = {
  SET_UNAVAILABLE: "TECHNICIAN_SET_UNAVAILABLE",
  CLEAR_UNAVAILABLE: "TECHNICIAN_CLEAR_UNAVAILABLE",
  AUTO_EXPIRE_UNAVAILABLE: "TECHNICIAN_AUTO_EXPIRE_UNAVAILABLE",
  AUTO_ASSIGN: "TICKET_AUTO_ASSIGN",
  AUTO_ASSIGN_FAILED: "TICKET_AUTO_ASSIGN_FAILED",
} as const;

export type TechAction = (typeof TECH_ACTIONS)[keyof typeof TECH_ACTIONS];

export async function writeAudit(params: {
  action: TechAction;
  targetTable: string;
  targetId: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedById: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        targetTable: params.targetTable,
        targetId: params.targetId,
        oldValue: (params.oldValue ?? undefined) as never,
        newValue: (params.newValue ?? undefined) as never,
        performedById: params.performedById,
      },
    });
  } catch (err) {
    logger.error({ err, action: params.action }, "Technicians: failed to write audit log");
  }
}

export async function notify(params: {
  userIds: readonly string[];
  title: string;
  message: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  referenceId?: string;
}): Promise<void> {
  if (params.userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: params.userIds.map((userId) => ({
        userId,
        title: params.title,
        message: params.message,
        type: params.type ?? "INFO",
        category: "SYSTEM",
        referenceId: params.referenceId ?? null,
      })),
    });
  } catch (err) {
    logger.error({ err, title: params.title }, "Technicians: failed to create notifications");
  }
}
