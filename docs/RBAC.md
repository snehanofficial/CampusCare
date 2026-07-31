# RBAC.md
## CampusCare — Role-Based Access Control Architecture

> **Status:** Phase 1 Implementation Reference  
> **Pattern:** Database-backed RBAC with per-user permission overrides  
> **Stack:** Express 5 · Prisma 7 · JWT (permissions embedded)

---

## 1. Purpose

This document defines the complete RBAC architecture for CampusCare. It covers the role hierarchy, permission codes, the database model, the backend permission middleware, the frontend permission guards, and the `usePermission` hook.

RBAC is enforced at **three layers:**
1. **Backend Middleware** — HTTP request is rejected if the actor lacks the required permission
2. **Frontend Route Guard** — React routes are blocked if the user lacks permission
3. **Frontend Component Guard** — UI elements are conditionally rendered based on permissions

---

## 2. Role Hierarchy

```
SYSTEM_ADMIN
     │ (full access)
     ├── DEPT_ADMIN
     │       │ (manages own department)
     │       ├── TECHNICIAN
     │       │       │ (handles tickets & assets)
     │       │       ├── FACULTY
     │       │       │       (submits tickets, views dept assets)
     │       │       └── STUDENT
     │                       (submits & tracks own tickets)
```

Roles are **not** inheritable in code. Each role has an explicit permission set. This prevents accidental privilege escalation through role hierarchy bugs.

---

## 3. Permission Registry

All permission codes follow the pattern: `resource:action`

### Core Permissions (Phase 1)

| Permission Code | Description |
|:---|:---|
| `tickets:create` | Submit a new support ticket |
| `tickets:read_own` | View tickets the user created |
| `tickets:read_all` | View all tickets in the system |
| `tickets:assign` | Assign a ticket to a technician |
| `tickets:resolve` | Mark a ticket as resolved/closed |
| `tickets:delete` | Permanently delete a ticket |
| `assets:create` | Register a new asset |
| `assets:read` | View asset information |
| `assets:update` | Modify asset details |
| `assets:delete` | Remove an asset from the registry |
| `inventory:read` | View inventory items |
| `inventory:manage` | Add/deduct inventory items |
| `users:read` | View user accounts |
| `users:manage` | Create/disable user accounts |
| `departments:manage` | Create/modify departments |
| `categories:manage` | Create/modify ticket categories |
| `reports:view` | Access analytics and reports |
| `sla:manage` | Configure SLA policies |
| `audit:read` | View system audit logs |
| `settings:manage` | Access global system settings |
| `notifications:send` | Send system-wide notifications |
| `knowledge-base:manage` | Create/edit knowledge base articles |

---

## 4. Role-Permission Matrix

| Permission | STUDENT | FACULTY | TECHNICIAN | DEPT_ADMIN | SYSTEM_ADMIN |
|:---|:---:|:---:|:---:|:---:|:---:|
| `tickets:create` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tickets:read_own` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `tickets:read_all` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `tickets:assign` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `tickets:resolve` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `tickets:delete` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `assets:create` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `assets:read` | ✗ | ✓ | ✓ | ✓ | ✓ |
| `assets:update` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `assets:delete` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `inventory:read` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `inventory:manage` | ✗ | ✗ | ✓ | ✓ | ✓ |
| `users:read` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `users:manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `departments:manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `categories:manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `reports:view` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `sla:manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `audit:read` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `settings:manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `notifications:send` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `knowledge-base:manage` | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 5. Database Model

```
User ──────────────────────── Role ──────────────── RolePermission ── Permission
 │                                                                         ▲
 └─── UserPermission (Override) ──────────────────────────────────────────┘
```

### Models (already in schema.prisma)

**`Role`** — Named role (`STUDENT`, `FACULTY`, etc.)  
**`Permission`** — Named permission code (`tickets:create`, etc.)  
**`RolePermission`** — Many-to-many join (which permissions each role has)  
**`UserPermission`** — Per-user override; `isGranted` can be `true` (grant extra) or `false` (revoke temporarily); `expiresAt` enables temporary delegated access

---

## 6. Authorization Data Flow

### At Login (JWT includes permissions):

```
1. Fetch user from DB
2. Fetch role.permissions[] from DB (via JOIN)
3. Fetch active UserPermission overrides (where expiresAt IS NULL OR expiresAt > NOW)
4. Merge: base role permissions + active overrides
5. Embed final permissions[] array in JWT access token
6. Client stores access token in memory
```

### At API Request:

```
HTTP Request
     │
     ▼
[authenticate middleware]
  → Extract & verify JWT
  → Attach req.user = { id, role, permissions[] }
     │
     ▼
[authorize middleware]  authorize("tickets:read_all")
  → Check: req.user.permissions.includes("tickets:read_all")
  → 403 if not found
  → next() if found
     │
     ▼
[Route Controller]
```

---

## 7. Backend: Permission Middleware

### `middleware/authenticate.ts`
Validates the JWT and attaches `req.user` to the request context.

```typescript
// Attaches: req.user = { id, email, role, permissions }
export async function authenticate(req, res, next): Promise<void>
```

### `middleware/authorize.ts`
Checks if the authenticated user has the required permission.

```typescript
// Usage: router.get("/tickets", authenticate, authorize("tickets:read_all"), controller)
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user; // Set by authenticate middleware
    if (!user) throw new UnauthorizedError("Not authenticated");

    const hasPermission = requiredPermissions.every(
      (perm) => user.permissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenError(
        `Forbidden: required permissions [${requiredPermissions.join(", ")}]`
      );
    }

    next();
  };
}
```

**Design Decision — `every` vs `some`:** Using `every` enforces that ALL listed permissions are required (AND logic). For OR logic (any one of the permissions), pass a single permission or wrap in an array and use `some` at the call site.

---

## 8. Frontend: Permission Guards

### 8.1 Route-Level Guard — `PermissionGuard`

```tsx
// app/guards/PermissionGuard.tsx
interface PermissionGuardProps {
  requiredPermissions: string[];
  requireAll?: boolean; // default: true (AND logic)
  fallback?: React.ReactNode; // default: <Navigate to="/403" />
  children: React.ReactNode;
}

export function PermissionGuard({
  requiredPermissions,
  requireAll = true,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermission();

  const allowed = requireAll
    ? hasPermission(...requiredPermissions)
    : hasAnyPermission(...requiredPermissions);

  if (!allowed) {
    return fallback ?? <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
```

**Usage in router:**
```tsx
{
  path: "tickets",
  element: (
    <PermissionGuard requiredPermissions={["tickets:read_all"]}>
      <TicketListPage />
    </PermissionGuard>
  )
}
```

### 8.2 Component-Level Guard — `Can`

For inline UI elements (show/hide buttons, actions):

```tsx
// components/common/Can.tsx
interface CanProps {
  perform: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ perform, requireAll = true, children, fallback = null }: CanProps) {
  const permissions = Array.isArray(perform) ? perform : [perform];
  const { hasPermission, hasAnyPermission } = usePermission();

  const allowed = requireAll
    ? hasPermission(...permissions)
    : hasAnyPermission(...permissions);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

**Usage in component:**
```tsx
<Can perform="tickets:assign">
  <AssignTicketButton />
</Can>

<Can perform={["assets:update", "assets:delete"]} requireAll={false}>
  <AssetActionsMenu />
</Can>
```

---

## 9. Frontend: `usePermission` Hook

```typescript
// hooks/usePermission.ts
interface UsePermissionReturn {
  /** Check if user has ALL listed permissions */
  hasPermission: (...permissions: string[]) => boolean;
  /** Check if user has ANY of the listed permissions */
  hasAnyPermission: (...permissions: string[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (...roles: string[]) => boolean;
  /** Raw permissions array from auth context */
  permissions: string[];
  /** Current user role */
  role: string | null;
}
```

**Implementation:**
```typescript
export function usePermission(): UsePermissionReturn {
  const { user } = useAuth();

  const permissions = user?.permissions ?? [];
  const role = user?.role ?? null;

  const hasPermission = useCallback((...required: string[]) => {
    return required.every((p) => permissions.includes(p));
  }, [permissions]);

  const hasAnyPermission = useCallback((...required: string[]) => {
    return required.some((p) => permissions.includes(p));
  }, [permissions]);

  const hasRole = useCallback((...roles: string[]) => {
    return role !== null && roles.includes(role);
  }, [role]);

  return { hasPermission, hasAnyPermission, hasRole, permissions, role };
}
```

---

## 10. Protected Route Wrapper

```tsx
// app/guards/ProtectedRoute.tsx
// Requires authentication ONLY (no specific permissions)
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return <PageLoader />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

---

## 11. Sidebar Navigation Filtering

The sidebar navigation items are filtered based on permissions:

```typescript
// Navigation items with permission requirements
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tickets", href: "/tickets/mine", icon: Ticket, permission: "tickets:read_own" },
  { label: "All Tickets", href: "/tickets", icon: Ticket, permission: "tickets:read_all" },
  { label: "Assets", href: "/assets", icon: Server, permission: "assets:read" },
  { label: "Inventory", href: "/inventory", icon: Package, permission: "inventory:read" },
  { label: "Reports", href: "/reports", icon: BarChart2, permission: "reports:view" },
  { label: "Users", href: "/users", icon: Users, permission: "users:read" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "settings:manage" },
  { label: "Audit Log", href: "/audit", icon: Shield, permission: "audit:read" },
];

// In Sidebar component:
const visibleNavItems = NAV_ITEMS.filter(item =>
  !item.permission || hasPermission(item.permission)
);
```

---

## 12. Database Seeding — Roles & Permissions

On first boot, the database must be seeded with the system roles and their permission assignments. This is done via `prisma/seed.ts`.

**Seed order:**
1. Create all Permission records
2. Create all Role records
3. Create RolePermission joins (from the matrix above)
4. Create a default `SYSTEM_ADMIN` user

---

## 13. Permission Override Flow (Temporary Delegation)

```
DEPT_ADMIN grants STUDENT user temporary `tickets:assign` permission
     │
     ▼
POST /api/v1/users/:userId/permissions
{ permissionId: "...", isGranted: true, expiresAt: "2024-01-31T23:59:59Z" }
     │
     ▼
Creates UserPermission record
     │
     ▼
On next login, permissions[] in JWT includes "tickets:assign"
     │
     ▼
After expiresAt, the override is ignored in permission calculation
     │
     ▼
Token expires in ≤ 15min → Next refresh: permission no longer included
```

---

## 14. Security Rules

1. **Never skip authentication middleware** — Every non-public route must have `authenticate` middleware
2. **Principle of least privilege** — Assign the minimum permissions needed
3. **No client-side permission enforcement alone** — UI guards are UX helpers; backend middleware is the security layer
4. **Token revocation cascades** — Revoking a refresh token removes all derived permissions until re-login
5. **Overrides expire automatically** — `UserPermission.expiresAt` is always checked; never set to NULL for temporary grants

---

## 15. Future Extensibility

- **Department-scoped permissions:** Add `departmentId` to `UserPermission` for finer-grained scoping
- **Permission groups:** Bundle related permissions into named groups for easier bulk assignment
- **Audit on permission change:** Log all `UserPermission` mutations to `AuditLog`
- **Admin UI:** Build the settings module to manage roles/permissions through the UI rather than seed files
