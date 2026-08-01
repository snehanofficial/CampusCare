// Shared types for the GTPE (Granular Temporary Privilege Escalation) feature.

export interface PrivilegeUserRef {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId: string | null;
}

export interface PermissionRef {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  category: string;
  groupLabel: string;
}

export interface PermissionRegistryCategory {
  category: string;
  permissions: PermissionRef[];
}

export interface PermissionRegistry {
  total: number;
  categories: PermissionRegistryCategory[];
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
export type GrantStatus = "ACTIVE" | "EXPIRED" | "REVOKED";
export type ApprovalLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ApproverRole = "DEPT_ADMIN" | "SYSTEM_ADMIN";

export interface TemporaryPermissionRequest {
  id: string;
  requesterId: string;
  reason: string;
  durationMinutes: number;
  status: RequestStatus;
  approvalLevel: ApprovalLevel;
  requiredRole: ApproverRole;
  departmentId: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  requester: PrivilegeUserRef;
  reviewedBy: PrivilegeUserRef | null;
  items: { permissionId: string; permission: PermissionRef }[];
}

export interface TemporaryGrant {
  id: string;
  userId: string;
  permissionId: string;
  status: GrantStatus;
  source: string;
  reason: string | null;
  approvalLevel: ApprovalLevel | null;
  durationMinutes: number | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
  user: PrivilegeUserRef;
  permission: PermissionRef;
}

export interface EffectivePrivileges {
  count: number;
  hasTemporaryAccess: boolean;
  soonestExpiresAt: string | null;
  minutesRemaining: number;
  permissionsVersion: string;
  permissions: {
    grantId: string;
    code: string;
    displayName: string;
    category: string;
    expiresAt: string | null;
    minutesRemaining: number;
  }[];
}

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  items: { permissionId: string; permission: PermissionRef }[];
}

export interface ApprovalPolicy {
  id: string;
  permissionId: string | null;
  permissionCategory: string | null;
  approvalLevel: ApprovalLevel;
  approverRole: ApproverRole;
  maxDurationMinutes: number;
  autoApprove: boolean;
  isActive: boolean;
  permission?: PermissionRef | null;
}

export interface PaginatedPrivileges<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
