import { Prisma } from "@prisma/client";
import { logger } from "../../utils/logger.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { PrivilegesRepository } from "./privileges.repository.js";
import { GTPE_ACTIONS, notify, writeAudit } from "./privileges.events.js";
import {
  assertDurationWithinPolicy,
  computeExpiry,
  envelope,
  loadPermissionsAndPolicy,
  minutesRemaining,
  paginate,
  type ActorContext,
} from "./privileges.helpers.js";
import type { GrantAccessInput, ListFiltersInput, RevokeGrantInput } from "./privileges.schema.js";

/**
 * Direct admin grants, revocation and effective-permission reads.
 * The request/approval lifecycle lives in `privileges.requests.service.ts`.
 */
export class PrivilegesService {
  // ─── Direct admin grant (no approval step) ───────────────────────────────────
  static async grantAccess(actor: ActorContext, input: GrantAccessInput) {
    logger.info({ actorId: actor.id, userId: input.userId }, "PrivilegesService.grantAccess");

    const target = await PrivilegesRepository.findUserById(input.userId);
    if (!target) throw new NotFoundError("Target user not found");
    if (!target.isActive) throw new BadRequestError("Cannot grant access to a disabled account");
    // Prevents an admin from silently escalating their own privileges.
    if (target.id === actor.id) {
      throw new ForbiddenError("You cannot grant temporary access to yourself");
    }

    const { permissions, policy } = await loadPermissionsAndPolicy(input.permissionIds);
    if (policy.approverRole === "SYSTEM_ADMIN" && actor.role !== "SYSTEM_ADMIN") {
      throw new ForbiddenError("These permissions may only be granted by a System Administrator");
    }
    // SYSTEM_ADMIN may exceed the policy ceiling (custom durations); others may not.
    if (actor.role !== "SYSTEM_ADMIN") {
      assertDurationWithinPolicy(input.durationMinutes, policy);
    }

    const now = new Date();
    const expiresAt = computeExpiry(input.durationMinutes, now);

    const grants = await PrivilegesRepository.createGrants(
      permissions.map((permission) => ({
        userId: input.userId,
        permissionId: permission.id,
        isGranted: true,
        reason: input.reason,
        grantedById: actor.id,
        expiresAt,
        status: "ACTIVE",
        source: input.templateId ? "GTPE_TEMPLATE" : "GTPE_GRANT",
        templateId: input.templateId ?? null,
        approvalLevel: policy.approvalLevel,
        durationMinutes: input.durationMinutes,
        ipAddress: actor.ipAddress ?? null,
        deviceInfo: actor.deviceInfo ?? null,
      })),
    );

    await writeAudit({
      action: GTPE_ACTIONS.GRANT,
      targetTable: "user_permissions",
      targetId: input.userId,
      newValue: {
        permissions: permissions.map((p) => p.code),
        durationMinutes: input.durationMinutes,
        expiresAt,
        reason: input.reason,
      },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    await notify({
      userIds: [input.userId],
      title: "Temporary access granted",
      message: `You were granted ${permissions.length} temporary permission(s) for ${input.durationMinutes} minutes.`,
      type: "SUCCESS",
    });

    return grants;
  }

  // ─── Revoke ──────────────────────────────────────────────────────────────────
  static async revokeGrant(actor: ActorContext, grantId: string, input: RevokeGrantInput) {
    const grant = await PrivilegesRepository.findGrantById(grantId);
    if (!grant) throw new NotFoundError("Temporary permission grant not found");
    if (grant.status !== "ACTIVE") {
      throw new BadRequestError(`Grant is already ${grant.status.toLowerCase()}`);
    }

    const now = new Date();
    // Invariant: revoking MUST also set expiresAt=now, because the untouched
    // auth.service.ts permission merge only understands expiresAt — clearing
    // status alone would leave the permission live until its original expiry.
    const updated = await PrivilegesRepository.updateGrant(grantId, {
      status: "REVOKED",
      revokedAt: now,
      revokedById: actor.id,
      revokeReason: input.reason,
      expiresAt: now,
      isGranted: false,
    });

    await writeAudit({
      action: GTPE_ACTIONS.REVOKE,
      targetTable: "user_permissions",
      targetId: grantId,
      oldValue: { status: "ACTIVE", expiresAt: grant.expiresAt },
      newValue: { status: "REVOKED", expiresAt: now, reason: input.reason },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    await notify({
      userIds: [grant.userId],
      title: "Temporary access revoked",
      message: `Your temporary access to "${grant.permission.displayName}" was revoked. Reason: ${input.reason}`,
      type: "WARNING",
      referenceId: grantId,
    });

    return updated;
  }

  // ─── Reads ───────────────────────────────────────────────────────────────────
  static async listGrants(filters: ListFiltersInput, where: Prisma.UserPermissionWhereInput) {
    const { rows, total } = await PrivilegesRepository.findGrants({ where, ...paginate(filters) });
    return envelope(rows, total, filters);
  }

  /**
   * Live temporary-permission snapshot for the calling user.
   * Drives the navbar indicator and the client-side `permissionsVersion` poll
   * that triggers the existing token-refresh endpoint when the set changes.
   */
  static async getEffectivePrivileges(userId: string) {
    const now = new Date();
    const grants = await PrivilegesRepository.findEffectiveGrants(userId, now);
    const soonest = grants[0]?.expiresAt ?? null;
    return {
      count: grants.length,
      hasTemporaryAccess: grants.length > 0,
      soonestExpiresAt: soonest,
      minutesRemaining: minutesRemaining(soonest, now),
      permissionsVersion: grants
        .map((g) => `${g.permissionId}:${g.expiresAt?.getTime() ?? 0}`)
        .join("|"),
      permissions: grants.map((g) => ({
        grantId: g.id,
        code: g.permission.code,
        displayName: g.permission.displayName,
        category: g.permission.category,
        expiresAt: g.expiresAt,
        minutesRemaining: minutesRemaining(g.expiresAt, now),
      })),
    };
  }

  /** Flat CSV export of a grant history slice, for the History tab. */
  static buildHistoryCsv(
    rows: readonly {
      user: { email: string; firstName: string; lastName: string };
      permission: { code: string; displayName: string };
      status: string;
      source: string;
      durationMinutes: number | null;
      reason: string | null;
      createdAt: Date;
      expiresAt: Date | null;
      revokedAt: Date | null;
      revokeReason: string | null;
    }[],
  ): string {
    const header = [
      "User",
      "Email",
      "Permission",
      "Permission Code",
      "Status",
      "Source",
      "Duration (min)",
      "Reason",
      "Granted At",
      "Expires At",
      "Revoked At",
      "Revoke Reason",
    ];
    const escape = (value: unknown): string =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const lines = rows.map((r) =>
      [
        `${r.user.firstName} ${r.user.lastName}`,
        r.user.email,
        r.permission.displayName,
        r.permission.code,
        r.status,
        r.source,
        r.durationMinutes,
        r.reason,
        r.createdAt.toISOString(),
        r.expiresAt?.toISOString() ?? "",
        r.revokedAt?.toISOString() ?? "",
        r.revokeReason,
      ]
        .map(escape)
        .join(","),
    );

    return [header.map(escape).join(","), ...lines].join("\n");
  }
}
