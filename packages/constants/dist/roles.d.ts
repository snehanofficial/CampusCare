export declare const ROLES: {
    readonly SYSTEM_ADMIN: "SYSTEM_ADMIN";
    readonly DEPT_ADMIN: "DEPT_ADMIN";
    readonly TECHNICIAN: "TECHNICIAN";
    readonly FACULTY: "FACULTY";
    readonly STUDENT: "STUDENT";
};
export type SystemRole = typeof ROLES[keyof typeof ROLES];
export declare const PERMISSIONS: {
    readonly TICKETS_CREATE: "tickets:create";
    readonly TICKETS_READ_OWN: "tickets:read_own";
    readonly TICKETS_READ_ALL: "tickets:read_all";
    readonly TICKETS_UPDATE_OWN: "tickets:update_own";
    readonly TICKETS_UPDATE_ALL: "tickets:update_all";
    readonly TICKETS_DELETE: "tickets:delete";
    readonly TICKETS_ASSIGN: "tickets:assign";
    readonly TICKETS_RESOLVE: "tickets:resolve";
    readonly ASSETS_CREATE: "assets:create";
    readonly ASSETS_READ: "assets:read";
    readonly ASSETS_UPDATE: "assets:update";
    readonly ASSETS_DELETE: "assets:delete";
    readonly INVENTORY_READ: "inventory:read";
    readonly INVENTORY_UPDATE: "inventory:update";
    readonly USERS_READ: "users:read";
    readonly USERS_UPDATE: "users:update";
    readonly AUDIT_READ: "audit:read";
};
export type SystemPermission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
//# sourceMappingURL=roles.d.ts.map