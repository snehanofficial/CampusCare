import type { PermissionCode } from "./permissions.js";

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  DEPT_ADMIN: "DEPT_ADMIN",
  TECHNICIAN: "TECHNICIAN",
  FACULTY: "FACULTY",
  STUDENT: "STUDENT",
} as const;

export type SystemRole = typeof ROLES[keyof typeof ROLES];

export interface RoleSeedEntry {
  name: SystemRole;
  displayName: string;
  description: string;
  permissions: PermissionCode[];
}

export const ROLE_SEED_DATA: readonly RoleSeedEntry[] = [
  {
    name: "STUDENT",
    displayName: "Student",
    description: "Campus student — can submit and track own tickets",
    permissions: ["tickets:create", "tickets:read_own", "tickets:update_own"],
  },
  {
    name: "FACULTY",
    displayName: "Faculty / Staff",
    description: "Faculty member — can submit tickets and view department assets",
    permissions: [
      "tickets:create",
      "tickets:read_own",
      "tickets:update_own",
      "assets:read",
    ],
  },
  {
    name: "TECHNICIAN",
    displayName: "IT Technician",
    description: "IT support technician — handles tickets and manages assets",
    permissions: [
      "tickets:create",
      "tickets:read_own",
      "tickets:read_all",
      "tickets:update_own",
      "tickets:update_all",
      "tickets:assign",
      "tickets:resolve",
      "assets:read",
      "assets:update",
      "inventory:read",
      "inventory:manage",
    ],
  },
  {
    name: "DEPT_ADMIN",
    displayName: "Department Administrator",
    description: "Dept admin — manages team, views SLA, creates assets",
    permissions: [
      "tickets:create",
      "tickets:read_own",
      "tickets:read_all",
      "tickets:update_own",
      "tickets:update_all",
      "tickets:assign",
      "tickets:resolve",
      "assets:create",
      "assets:read",
      "assets:update",
      "inventory:read",
      "inventory:manage",
      "users:read",
      "reports:view",
      "reports:export",
      "notifications:send",
      "knowledge-base:manage",
      "service_status.manage",
    ],
  },
  {
    name: "SYSTEM_ADMIN",
    displayName: "System Administrator",
    description: "Full system access — all permissions",
    permissions: [
      "tickets:create",
      "tickets:read_own",
      "tickets:read_all",
      "tickets:update_own",
      "tickets:update_all",
      "tickets:assign",
      "tickets:resolve",
      "tickets:delete",
      "assets:create",
      "assets:read",
      "assets:update",
      "assets:delete",
      "inventory:read",
      "inventory:manage",
      "users:read",
      "users:manage",
      "departments:manage",
      "categories:manage",
      "reports:view",
      "reports:export",
      "reports:admin",
      "sla:manage",
      "audit:read",
      "settings:manage",
      "notifications:send",
      "knowledge-base:manage",
      "service_status.manage",
    ],
  },
] as const;
