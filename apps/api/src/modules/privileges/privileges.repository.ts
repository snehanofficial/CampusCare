import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

// ─── Shared include blocks ─────────────────────────────────────────────────────
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  departmentId: true,
} satisfies Prisma.UserSelect;

const PERMISSION_SELECT = {
  id: true,
  code: true,
  displayName: true,
  description: true,
  category: true,
  groupLabel: true,
} satisfies Prisma.PermissionSelect;

const GRANT_INCLUDE = {
  user: { select: USER_SELECT },
  permission: { select: PERMISSION_SELECT },
} satisfies Prisma.UserPermissionInclude;

const REQUEST_INCLUDE = {
  requester: { select: USER_SELECT },
  reviewedBy: { select: USER_SELECT },
  items: { include: { permission: { select: PERMISSION_SELECT } } },
} satisfies Prisma.TemporaryPermissionRequestInclude;

const TEMPLATE_INCLUDE = {
  items: { include: { permission: { select: PERMISSION_SELECT } } },
  createdBy: { select: USER_SELECT },
} satisfies Prisma.PermissionTemplateInclude;

export class PrivilegesRepository {
  // ─── Permission registry ─────────────────────────────────────────────────────
  static async findPermissionsByIds(ids: readonly string[]) {
    return prisma.permission.findMany({
      where: { id: { in: [...ids] } },
      select: PERMISSION_SELECT,
    });
  }

  static async listAllPermissions() {
    return prisma.permission.findMany({
      select: PERMISSION_SELECT,
      orderBy: [{ category: "asc" }, { displayName: "asc" }],
    });
  }

  // ─── Approval policies ───────────────────────────────────────────────────────
  static async listActivePolicies() {
    return prisma.approvalPolicy.findMany({ where: { isActive: true } });
  }

  static async listPolicies() {
    return prisma.approvalPolicy.findMany({
      include: { permission: { select: PERMISSION_SELECT } },
      orderBy: { createdAt: "asc" },
    });
  }

  static async findPolicyById(id: string) {
    return prisma.approvalPolicy.findUnique({ where: { id } });
  }

  static async createPolicy(data: Prisma.ApprovalPolicyUncheckedCreateInput) {
    return prisma.approvalPolicy.create({ data });
  }

  static async updatePolicy(id: string, data: Prisma.ApprovalPolicyUpdateInput) {
    return prisma.approvalPolicy.update({ where: { id }, data });
  }

  // ─── Requests ────────────────────────────────────────────────────────────────
  static async createRequest(
    data: Omit<Prisma.TemporaryPermissionRequestUncheckedCreateInput, "items">,
    permissionIds: readonly string[],
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.temporaryPermissionRequest.create({ data });
      await tx.temporaryPermissionRequestItem.createMany({
        data: permissionIds.map((permissionId) => ({ requestId: request.id, permissionId })),
        skipDuplicates: true,
      });
      return tx.temporaryPermissionRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: REQUEST_INCLUDE,
      });
    });
  }

  static async findRequestById(id: string) {
    return prisma.temporaryPermissionRequest.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
  }

  static async findRequests(params: {
    where: Prisma.TemporaryPermissionRequestWhereInput;
    skip?: number;
    take?: number;
  }) {
    const [rows, total] = await Promise.all([
      prisma.temporaryPermissionRequest.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: REQUEST_INCLUDE,
      }),
      prisma.temporaryPermissionRequest.count({ where: params.where }),
    ]);
    return { rows, total };
  }

  static async updateRequest(
    id: string,
    data: Prisma.TemporaryPermissionRequestUncheckedUpdateInput,
  ) {
    return prisma.temporaryPermissionRequest.update({
      where: { id },
      data,
      include: REQUEST_INCLUDE,
    });
  }

  static async findStaleRequests(before: Date) {
    return prisma.temporaryPermissionRequest.findMany({
      where: { status: "PENDING", createdAt: { lt: before } },
      include: REQUEST_INCLUDE,
    });
  }

  static async markRequestsExpired(ids: readonly string[]) {
    return prisma.temporaryPermissionRequest.updateMany({
      where: { id: { in: [...ids] } },
      data: { status: "EXPIRED" },
    });
  }

  // ─── Grants (UserPermission rows) ────────────────────────────────────────────
  /**
   * Creates the temporary grant rows in a single transaction.
   * Any pre-existing ACTIVE GTPE row for the same user+permission is superseded
   * so a user never ends up with two live grants for one permission.
   */
  static async createGrants(
    rows: readonly Prisma.UserPermissionUncheckedCreateInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      for (const row of rows) {
        await tx.userPermission.updateMany({
          where: {
            userId: row.userId,
            permissionId: row.permissionId,
            status: "ACTIVE",
            source: { not: "MANUAL" },
          },
          data: { status: "REVOKED", revokedAt: new Date(), expiresAt: new Date() },
        });
        await tx.userPermission.create({ data: row });
      }
      return tx.userPermission.findMany({
        where: {
          userId: rows[0]?.userId,
          permissionId: { in: rows.map((r) => r.permissionId) },
          status: "ACTIVE",
        },
        include: GRANT_INCLUDE,
      });
    });
  }

  static async findGrantById(id: string) {
    return prisma.userPermission.findUnique({ where: { id }, include: GRANT_INCLUDE });
  }

  static async findGrants(params: {
    where: Prisma.UserPermissionWhereInput;
    skip?: number;
    take?: number;
  }) {
    const [rows, total] = await Promise.all([
      prisma.userPermission.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
        include: GRANT_INCLUDE,
      }),
      prisma.userPermission.count({ where: params.where }),
    ]);
    return { rows, total };
  }

  static async updateGrant(id: string, data: Prisma.UserPermissionUpdateInput) {
    return prisma.userPermission.update({ where: { id }, data, include: GRANT_INCLUDE });
  }

  /** Active grants whose expiry has already passed — the scheduler's sweep set. */
  static async findExpiredGrants(now: Date) {
    return prisma.userPermission.findMany({
      where: { status: "ACTIVE", source: { not: "MANUAL" }, expiresAt: { lte: now } },
      include: GRANT_INCLUDE,
    });
  }

  /** Active grants expiring inside the window that have not yet been warned about. */
  static async findExpiringSoonGrants(now: Date, until: Date) {
    return prisma.userPermission.findMany({
      where: {
        status: "ACTIVE",
        source: { not: "MANUAL" },
        notifiedExpiringSoon: false,
        expiresAt: { gt: now, lte: until },
      },
      include: GRANT_INCLUDE,
    });
  }

  static async markGrantsExpired(ids: readonly string[], now: Date) {
    return prisma.userPermission.updateMany({
      where: { id: { in: [...ids] } },
      data: { status: "EXPIRED", expiresAt: now },
    });
  }

  static async markGrantsNotified(ids: readonly string[]) {
    return prisma.userPermission.updateMany({
      where: { id: { in: [...ids] } },
      data: { notifiedExpiringSoon: true },
    });
  }

  /** Live temporary permission codes for a user — drives the navbar indicator. */
  static async findEffectiveGrants(userId: string, now: Date) {
    return prisma.userPermission.findMany({
      where: {
        userId,
        isGranted: true,
        status: "ACTIVE",
        source: { not: "MANUAL" },
        expiresAt: { gt: now },
      },
      include: GRANT_INCLUDE,
      orderBy: { expiresAt: "asc" },
    });
  }

  // ─── Templates ───────────────────────────────────────────────────────────────
  static async listTemplates(includeInactive: boolean) {
    return prisma.permissionTemplate.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: TEMPLATE_INCLUDE,
      orderBy: { name: "asc" },
    });
  }

  static async findTemplateById(id: string) {
    return prisma.permissionTemplate.findUnique({ where: { id }, include: TEMPLATE_INCLUDE });
  }

  static async findTemplateByName(name: string) {
    return prisma.permissionTemplate.findUnique({ where: { name } });
  }

  static async createTemplate(
    data: Omit<Prisma.PermissionTemplateUncheckedCreateInput, "items">,
    permissionIds: readonly string[],
  ) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.permissionTemplate.create({ data });
      await tx.permissionTemplateItem.createMany({
        data: permissionIds.map((permissionId) => ({ templateId: template.id, permissionId })),
        skipDuplicates: true,
      });
      return tx.permissionTemplate.findUniqueOrThrow({
        where: { id: template.id },
        include: TEMPLATE_INCLUDE,
      });
    });
  }

  static async updateTemplate(
    id: string,
    data: Prisma.PermissionTemplateUpdateInput,
    permissionIds?: readonly string[],
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.permissionTemplate.update({ where: { id }, data });
      if (permissionIds) {
        await tx.permissionTemplateItem.deleteMany({ where: { templateId: id } });
        await tx.permissionTemplateItem.createMany({
          data: permissionIds.map((permissionId) => ({ templateId: id, permissionId })),
          skipDuplicates: true,
        });
      }
      return tx.permissionTemplate.findUniqueOrThrow({
        where: { id },
        include: TEMPLATE_INCLUDE,
      });
    });
  }

  // ─── Approver lookup ─────────────────────────────────────────────────────────
  /** Users holding the approver role, optionally scoped to a department. */
  static async findApprovers(roleName: string, departmentId: string | null) {
    const roleNames = roleName === "DEPT_ADMIN" ? ["DEPT_ADMIN", "SYSTEM_ADMIN"] : ["SYSTEM_ADMIN"];
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: { in: roleNames } },
        ...(departmentId && roleName === "DEPT_ADMIN"
          ? { OR: [{ departmentId }, { role: { name: "SYSTEM_ADMIN" } }] }
          : {}),
      },
      select: USER_SELECT,
    });
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { ...USER_SELECT, isActive: true, role: { select: { name: true } } },
    });
  }
}
