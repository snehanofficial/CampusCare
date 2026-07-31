"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSIONS = exports.ROLES = void 0;
exports.ROLES = {
    SYSTEM_ADMIN: "SYSTEM_ADMIN",
    DEPT_ADMIN: "DEPT_ADMIN",
    TECHNICIAN: "TECHNICIAN",
    FACULTY: "FACULTY",
    STUDENT: "STUDENT"
};
exports.PERMISSIONS = {
    // Ticket permissions
    TICKETS_CREATE: "tickets:create",
    TICKETS_READ_OWN: "tickets:read_own",
    TICKETS_READ_ALL: "tickets:read_all",
    TICKETS_UPDATE_OWN: "tickets:update_own",
    TICKETS_UPDATE_ALL: "tickets:update_all",
    TICKETS_DELETE: "tickets:delete",
    TICKETS_ASSIGN: "tickets:assign",
    TICKETS_RESOLVE: "tickets:resolve",
    // Asset permissions
    ASSETS_CREATE: "assets:create",
    ASSETS_READ: "assets:read",
    ASSETS_UPDATE: "assets:update",
    ASSETS_DELETE: "assets:delete",
    // Inventory permissions
    INVENTORY_READ: "inventory:read",
    INVENTORY_UPDATE: "inventory:update",
    // User management
    USERS_READ: "users:read",
    USERS_UPDATE: "users:update",
    // Audit logs
    AUDIT_READ: "audit:read"
};
//# sourceMappingURL=roles.js.map