import { Request } from "express";
import { BadRequestError } from "../../utils/errors.js";
import { PrivilegesRepository } from "./privileges.repository.js";
import type { AuditContext } from "./privileges.events.js";
import { APPROVAL_LEVELS, APPROVER_ROLES, type ListFiltersInput } from "./privileges.schema.js";

export type ApprovalLevel = (typeof APPROVAL_LEVELS)[number];
export type ApproverRole = (typeof APPROVER_ROLES)[number];

export interface ResolvedPolicy {
  approvalLevel: ApprovalLevel;
  approverRole: ApproverRole;
  maxDurationMinutes: number;
  autoApprove: boolean;
}

/** Applied when no ApprovalPolicy row matches the permission or its category. */
export const FALLBACK_POLICY: ResolvedPolicy = {
  approvalLevel: "LOW",
  approverRole: "DEPT_ADMIN",
  maxDurationMinutes: 60,
  autoApprove: false,
};

const LEVEL_RANK: Record<ApprovalLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const ROLE_RANK: Record<ApproverRole, number> = {
  DEPT_ADMIN: 0,
  SYSTEM_ADMIN: 1,
};

interface PolicyRow {
  permissionId: string | null;
  permissionCategory: string | null;
  approvalLevel: string;
  approverRole: string;
  maxDurationMinutes: number;
  autoApprove: boolean;
}

interface PermissionRow {
  id: string;
  category: string;
}

function coerceLevel(value: string): ApprovalLevel {
  return (APPROVAL_LEVELS as readonly string[]).includes(value)
    ? (value as ApprovalLevel)
    : FALLBACK_POLICY.approvalLevel;
}

function coerceRole(value: string): ApproverRole {
  return (APPROVER_ROLES as readonly string[]).includes(value)
    ? (value as ApproverRole)
    : FALLBACK_POLICY.approverRole;
}

/**
 * Resolve the effective policy for a single permission.
 * Precedence: exact permission match → category match → hardcoded fallback.
 */
export function resolvePolicyForPermission(
  permission: PermissionRow,
  policies: readonly PolicyRow[],
): ResolvedPolicy {
  const exact = policies.find((p) => p.permissionId === permission.id);
  const byCategory = policies.find((p) => p.permissionCategory === permission.category);
  const matched = exact ?? byCategory;

  if (!matched) return FALLBACK_POLICY;

  return {
    approvalLevel: coerceLevel(matched.approvalLevel),
    approverRole: coerceRole(matched.approverRole),
    maxDurationMinutes: matched.maxDurationMinutes,
    autoApprove: matched.autoApprove,
  };
}

/**
 * Resolve the aggregate policy across a set of permissions.
 * The strictest wins: highest approval level, highest approver role,
 * lowest max duration, and autoApprove only when every permission allows it.
 */
export function resolveApprovalPolicy(
  permissions: readonly PermissionRow[],
  policies: readonly PolicyRow[],
): ResolvedPolicy {
  if (permissions.length === 0) return FALLBACK_POLICY;

  return permissions.reduce<ResolvedPolicy>((acc, permission) => {
    const resolved = resolvePolicyForPermission(permission, policies);
    return {
      approvalLevel:
        LEVEL_RANK[resolved.approvalLevel] > LEVEL_RANK[acc.approvalLevel]
          ? resolved.approvalLevel
          : acc.approvalLevel,
      approverRole:
        ROLE_RANK[resolved.approverRole] > ROLE_RANK[acc.approverRole]
          ? resolved.approverRole
          : acc.approverRole,
      maxDurationMinutes: Math.min(resolved.maxDurationMinutes, acc.maxDurationMinutes),
      autoApprove: resolved.autoApprove && acc.autoApprove,
    };
  }, {
    approvalLevel: "LOW",
    approverRole: "DEPT_ADMIN",
    maxDurationMinutes: Number.MAX_SAFE_INTEGER,
    autoApprove: true,
  });
}

/** Expiry timestamp for a grant starting now. */
export function computeExpiry(durationMinutes: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + durationMinutes * 60_000);
}

/** Minutes remaining until `expiresAt`, floored at 0. */
export function minutesRemaining(expiresAt: Date | null, now: Date = new Date()): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 60_000));
}

/** Compact, non-PII device descriptor derived from request headers. */
export function buildDeviceInfo(req: Request): string {
  const userAgent = req.headers["user-agent"];
  if (typeof userAgent !== "string" || userAgent.length === 0) return "Unknown device";
  return userAgent.slice(0, 255);
}

/** Best-effort client IP, honouring the proxy header when present. */
export function buildIpAddress(req: Request): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

// ─── Service-layer shared utilities ────────────────────────────────────────────

/** The authenticated actor as consumed by the GTPE services. */
export interface ActorContext extends AuditContext {
  id: string;
  role: string;
  departmentId?: string | null;
  deviceInfo?: string | undefined;
}

export function paginate(filters: ListFiltersInput): { skip: number; take: number } {
  return { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize };
}

export function envelope<T>(rows: T[], total: number, filters: ListFiltersInput) {
  return {
    data: rows,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    pageCount: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

/** Loads permissions, verifies every requested id exists, and resolves the policy. */
export async function loadPermissionsAndPolicy(permissionIds: readonly string[]) {
  const permissions = await PrivilegesRepository.findPermissionsByIds(permissionIds);
  if (permissions.length !== new Set(permissionIds).size) {
    throw new BadRequestError("One or more selected permissions do not exist");
  }
  const policies = await PrivilegesRepository.listActivePolicies();
  return { permissions, policy: resolveApprovalPolicy(permissions, policies) };
}

export function assertDurationWithinPolicy(
  durationMinutes: number,
  policy: ResolvedPolicy,
): void {
  if (durationMinutes > policy.maxDurationMinutes) {
    throw new BadRequestError(
      `Requested duration exceeds the maximum of ${policy.maxDurationMinutes} minutes allowed for these permissions`,
    );
  }
}
