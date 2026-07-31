// Permission Registry — single source of truth for all permission codes
// Each entry maps the code to display metadata used in the UI and database seed

export interface PermissionEntry {
  code: string;
  displayName: string;
  description: string;
  category: string;
  groupLabel: string;
}

export const PERMISSION_REGISTRY: readonly PermissionEntry[] = [
  // ─── Tickets ────────────────────────────────────────────────────────────────
  {
    code: "tickets:create",
    displayName: "Create Tickets",
    description: "Submit new support tickets",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:read_own",
    displayName: "View Own Tickets",
    description: "View tickets the user created",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:read_all",
    displayName: "View All Tickets",
    description: "View all tickets across the system",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:update_own",
    displayName: "Edit Own Tickets",
    description: "Update tickets the user submitted",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:update_all",
    displayName: "Edit Any Ticket",
    description: "Update any ticket in the system",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:assign",
    displayName: "Assign Tickets",
    description: "Assign tickets to technicians",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:resolve",
    displayName: "Resolve Tickets",
    description: "Mark tickets as resolved or closed",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  {
    code: "tickets:delete",
    displayName: "Delete Tickets",
    description: "Permanently delete tickets from the system",
    category: "Tickets",
    groupLabel: "Support Operations",
  },
  // ─── Assets ─────────────────────────────────────────────────────────────────
  {
    code: "assets:create",
    displayName: "Register Assets",
    description: "Add new assets to the registry",
    category: "Assets",
    groupLabel: "Infrastructure Management",
  },
  {
    code: "assets:read",
    displayName: "View Assets",
    description: "View asset details and history",
    category: "Assets",
    groupLabel: "Infrastructure Management",
  },
  {
    code: "assets:update",
    displayName: "Edit Assets",
    description: "Modify asset details and record history",
    category: "Assets",
    groupLabel: "Infrastructure Management",
  },
  {
    code: "assets:delete",
    displayName: "Delete Assets",
    description: "Remove assets from the registry",
    category: "Assets",
    groupLabel: "Infrastructure Management",
  },
  // ─── Inventory ──────────────────────────────────────────────────────────────
  {
    code: "inventory:read",
    displayName: "View Inventory",
    description: "View spare parts and inventory items",
    category: "Inventory",
    groupLabel: "Infrastructure Management",
  },
  {
    code: "inventory:manage",
    displayName: "Manage Inventory",
    description: "Add, deduct, and transfer inventory items",
    category: "Inventory",
    groupLabel: "Infrastructure Management",
  },
  // ─── Users ──────────────────────────────────────────────────────────────────
  {
    code: "users:read",
    displayName: "View Users",
    description: "View user accounts and profiles",
    category: "Users",
    groupLabel: "Administration",
  },
  {
    code: "users:manage",
    displayName: "Manage Users",
    description: "Create, edit, and disable user accounts",
    category: "Users",
    groupLabel: "Administration",
  },
  // ─── Departments ────────────────────────────────────────────────────────────
  {
    code: "departments:manage",
    displayName: "Manage Departments",
    description: "Create and modify department records",
    category: "Departments",
    groupLabel: "Administration",
  },
  // ─── Categories ─────────────────────────────────────────────────────────────
  {
    code: "categories:manage",
    displayName: "Manage Categories",
    description: "Create and modify ticket categories",
    category: "Categories",
    groupLabel: "Administration",
  },
  // ─── Reports & Analytics ────────────────────────────────────────────────────
  {
    code: "reports:view",
    displayName: "View Reports",
    description: "Access analytics dashboards and export reports",
    category: "Reports",
    groupLabel: "Intelligence",
  },
  // ─── SLA ────────────────────────────────────────────────────────────────────
  {
    code: "sla:manage",
    displayName: "Manage SLA Policies",
    description: "Configure response and resolution time limits",
    category: "SLA",
    groupLabel: "Administration",
  },
  // ─── Audit ──────────────────────────────────────────────────────────────────
  {
    code: "audit:read",
    displayName: "View Audit Log",
    description: "Read the full system audit trail",
    category: "Audit",
    groupLabel: "Administration",
  },
  // ─── Settings ───────────────────────────────────────────────────────────────
  {
    code: "settings:manage",
    displayName: "Manage Settings",
    description: "Access and modify global system settings",
    category: "Settings",
    groupLabel: "Administration",
  },
  // ─── Notifications ──────────────────────────────────────────────────────────
  {
    code: "notifications:send",
    displayName: "Send Notifications",
    description: "Send system-wide announcements and notifications",
    category: "Notifications",
    groupLabel: "Communication",
  },
  // ─── Knowledge Base ─────────────────────────────────────────────────────────
  {
    code: "knowledge-base:manage",
    displayName: "Manage Knowledge Base",
    description: "Create, publish, and delete knowledge base articles",
    category: "Knowledge Base",
    groupLabel: "Communication",
  },
] as const;

// Convenience lookup: code → entry
export const PERMISSION_MAP = new Map<string, PermissionEntry>(
  PERMISSION_REGISTRY.map((p) => [p.code, p]),
);

// Flat list of codes for quick membership checks
export const PERMISSIONS = {
  TICKETS_CREATE: "tickets:create",
  TICKETS_READ_OWN: "tickets:read_own",
  TICKETS_READ_ALL: "tickets:read_all",
  TICKETS_UPDATE_OWN: "tickets:update_own",
  TICKETS_UPDATE_ALL: "tickets:update_all",
  TICKETS_ASSIGN: "tickets:assign",
  TICKETS_RESOLVE: "tickets:resolve",
  TICKETS_DELETE: "tickets:delete",
  ASSETS_CREATE: "assets:create",
  ASSETS_READ: "assets:read",
  ASSETS_UPDATE: "assets:update",
  ASSETS_DELETE: "assets:delete",
  INVENTORY_READ: "inventory:read",
  INVENTORY_MANAGE: "inventory:manage",
  USERS_READ: "users:read",
  USERS_MANAGE: "users:manage",
  DEPARTMENTS_MANAGE: "departments:manage",
  CATEGORIES_MANAGE: "categories:manage",
  REPORTS_VIEW: "reports:view",
  SLA_MANAGE: "sla:manage",
  AUDIT_READ: "audit:read",
  SETTINGS_MANAGE: "settings:manage",
  NOTIFICATIONS_SEND: "notifications:send",
  KNOWLEDGE_BASE_MANAGE: "knowledge-base:manage",
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];
