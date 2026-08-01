import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";

/**
 * Audit + notification writers for the GTPE module.
 *
 * Follows the repo-wide convention of inline `prisma.auditLog.create` /
 * `prisma.notification.create` calls (there is no shared audit or notification
 * service). Both writers are best-effort: a failure is logged but never
 * propagated, so it can never roll back the grant/revoke it describes.
 */

export const GTPE_ACTIONS = {
  REQUEST: "GTPE_REQUEST",
  APPROVE: "GTPE_APPROVE",
  REJECT: "GTPE_REJECT",
  CANCEL: "GTPE_CANCEL",
  GRANT: "GTPE_GRANT",
  REVOKE: "GTPE_REVOKE",
  EXPIRE: "GTPE_EXPIRE",
  TEMPLATE_CREATE: "GTPE_TEMPLATE_CREATE",
  TEMPLATE_UPDATE: "GTPE_TEMPLATE_UPDATE",
  TEMPLATE_DELETE: "GTPE_TEMPLATE_DELETE",
  POLICY_UPDATE: "GTPE_POLICY_UPDATE",
} as const;

export type GtpeAction = (typeof GTPE_ACTIONS)[keyof typeof GTPE_ACTIONS];

export interface AuditContext {
  performedById: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface WriteAuditParams extends AuditContext {
  action: GtpeAction;
  targetTable: string;
  targetId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Append-only audit row. Never updated or deleted. */
export async function writeAudit(params: WriteAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        targetTable: params.targetTable,
        targetId: params.targetId,
        oldValue: (params.oldValue ?? undefined) as never,
        newValue: (params.newValue ?? undefined) as never,
        performedById: params.performedById,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    logger.error({ err, action: params.action }, "GTPE: failed to write audit log");
  }
}

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface NotifyParams {
  userIds: readonly string[];
  title: string;
  message: string;
  type?: NotificationType;
  referenceId?: string | undefined;
}

/** Fan-out in-app notification. Best effort; failures never block the caller. */
export async function notify(params: NotifyParams): Promise<void> {
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
    logger.error({ err, title: params.title }, "GTPE: failed to create notifications");
  }
}
