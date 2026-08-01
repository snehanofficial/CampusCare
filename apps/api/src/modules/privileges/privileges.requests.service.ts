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
  paginate,
  type ActorContext,
} from "./privileges.helpers.js";
import type { CreateRequestInput, ListFiltersInput } from "./privileges.schema.js";

/**
 * Request lifecycle for GTPE: submit → review (approve/reject) → cancel.
 * Direct admin grants, revocation and effective-permission reads live in
 * `privileges.service.ts`; template/policy CRUD in `privileges.templates.service.ts`.
 */
export class PrivilegeRequestsService {
  // ─── Submit ──────────────────────────────────────────────────────────────────
  static async createRequest(actor: ActorContext, input: CreateRequestInput) {
    logger.info({ actorId: actor.id }, "PrivilegeRequestsService.createRequest");

    const { permissions, policy } = await loadPermissionsAndPolicy(input.permissionIds);
    assertDurationWithinPolicy(input.durationMinutes, policy);

    const now = new Date();
    const active = await PrivilegesRepository.findEffectiveGrants(actor.id, now);
    const duplicate = permissions.find((p) => active.some((g) => g.permissionId === p.id));
    if (duplicate) {
      throw new BadRequestError(
        `You already hold active temporary access to "${duplicate.displayName}"`,
      );
    }

    const request = await PrivilegesRepository.createRequest(
      {
        requesterId: actor.id,
        reason: input.reason,
        durationMinutes: input.durationMinutes,
        status: "PENDING",
        approvalLevel: policy.approvalLevel,
        requiredRole: policy.approverRole,
        departmentId: actor.departmentId ?? null,
        ipAddress: actor.ipAddress ?? null,
        deviceInfo: actor.deviceInfo ?? null,
      },
      input.permissionIds,
    );

    await writeAudit({
      action: GTPE_ACTIONS.REQUEST,
      targetTable: "temporary_permission_requests",
      targetId: request.id,
      newValue: {
        permissions: permissions.map((p) => p.code),
        durationMinutes: input.durationMinutes,
        approvalLevel: policy.approvalLevel,
      },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    const approvers = await PrivilegesRepository.findApprovers(
      policy.approverRole,
      actor.departmentId ?? null,
    );
    await notify({
      userIds: [actor.id],
      title: "Temporary access request submitted",
      message: `Your request for ${permissions.length} permission(s) is awaiting review.`,
      referenceId: request.id,
    });
    await notify({
      userIds: approvers.filter((a) => a.id !== actor.id).map((a) => a.id),
      title: "New temporary access request",
      message: `${request.requester.firstName} ${request.requester.lastName} requested ${permissions.length} permission(s) for ${input.durationMinutes} minutes.`,
      type: "WARNING",
      referenceId: request.id,
    });

    return request;
  }

  // ─── List ────────────────────────────────────────────────────────────────────
  static async listRequests(
    filters: ListFiltersInput,
    where: Prisma.TemporaryPermissionRequestWhereInput,
  ) {
    const { rows, total } = await PrivilegesRepository.findRequests({ where, ...paginate(filters) });
    return envelope(rows, total, filters);
  }

  // ─── Approve ─────────────────────────────────────────────────────────────────
  static async approveRequest(actor: ActorContext, requestId: string, note?: string) {
    logger.info({ actorId: actor.id, requestId }, "PrivilegeRequestsService.approveRequest");

    const request = await PrivilegesRepository.findRequestById(requestId);
    if (!request) throw new NotFoundError("Temporary access request not found");
    if (request.status !== "PENDING") {
      throw new BadRequestError(`Request has already been ${request.status.toLowerCase()}`);
    }
    // Self-approval is never permitted, regardless of role.
    if (request.requesterId === actor.id) {
      throw new ForbiddenError("You cannot approve your own temporary access request");
    }
    if (request.requiredRole === "SYSTEM_ADMIN" && actor.role !== "SYSTEM_ADMIN") {
      throw new ForbiddenError("This request requires a System Administrator approval");
    }

    const now = new Date();
    const expiresAt = computeExpiry(request.durationMinutes, now);

    await PrivilegesRepository.createGrants(
      request.items.map((item) => ({
        userId: request.requesterId,
        permissionId: item.permissionId,
        isGranted: true,
        reason: request.reason,
        grantedById: actor.id,
        expiresAt,
        status: "ACTIVE",
        source: "GTPE_REQUEST",
        sourceRequestId: request.id,
        approvalLevel: request.approvalLevel,
        durationMinutes: request.durationMinutes,
        ipAddress: actor.ipAddress ?? null,
        deviceInfo: actor.deviceInfo ?? null,
      })),
    );

    const updated = await PrivilegesRepository.updateRequest(requestId, {
      status: "APPROVED",
      reviewedById: actor.id,
      reviewedAt: now,
      reviewNote: note ?? null,
      activatedAt: now,
      expiresAt,
    });

    await writeAudit({
      action: GTPE_ACTIONS.APPROVE,
      targetTable: "temporary_permission_requests",
      targetId: requestId,
      oldValue: { status: "PENDING" },
      newValue: { status: "APPROVED", expiresAt, reviewNote: note ?? null },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    await notify({
      userIds: [request.requesterId],
      title: "Temporary access approved and activated",
      message: `Your request was approved and is now active for ${request.durationMinutes} minutes.`,
      type: "SUCCESS",
      referenceId: requestId,
    });

    return updated;
  }

  // ─── Reject ──────────────────────────────────────────────────────────────────
  static async rejectRequest(actor: ActorContext, requestId: string, note: string) {
    const request = await PrivilegesRepository.findRequestById(requestId);
    if (!request) throw new NotFoundError("Temporary access request not found");
    if (request.status !== "PENDING") {
      throw new BadRequestError(`Request has already been ${request.status.toLowerCase()}`);
    }
    if (request.requesterId === actor.id) {
      throw new ForbiddenError("You cannot review your own temporary access request");
    }

    const updated = await PrivilegesRepository.updateRequest(requestId, {
      status: "REJECTED",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNote: note,
    });

    await writeAudit({
      action: GTPE_ACTIONS.REJECT,
      targetTable: "temporary_permission_requests",
      targetId: requestId,
      oldValue: { status: "PENDING" },
      newValue: { status: "REJECTED", reviewNote: note },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    await notify({
      userIds: [request.requesterId],
      title: "Temporary access rejected",
      message: `Your request was rejected. Reason: ${note}`,
      type: "ERROR",
      referenceId: requestId,
    });

    return updated;
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────────
  static async cancelRequest(actor: ActorContext, requestId: string) {
    const request = await PrivilegesRepository.findRequestById(requestId);
    if (!request) throw new NotFoundError("Temporary access request not found");
    if (request.requesterId !== actor.id) {
      throw new ForbiddenError("Only the requester can cancel this request");
    }
    if (request.status !== "PENDING") {
      throw new BadRequestError("Only pending requests can be cancelled");
    }

    const updated = await PrivilegesRepository.updateRequest(requestId, {
      status: "CANCELLED",
      reviewedAt: new Date(),
    });

    await writeAudit({
      action: GTPE_ACTIONS.CANCEL,
      targetTable: "temporary_permission_requests",
      targetId: requestId,
      oldValue: { status: "PENDING" },
      newValue: { status: "CANCELLED" },
      performedById: actor.id,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return updated;
  }
}
