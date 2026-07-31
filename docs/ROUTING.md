# ROUTING.md
## CampusCare — Routing Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** React Router v8 (`react-router@8.x`) · `createBrowserRouter` · Data API  
> **Routing Mode:** Client-Side SPA (Declarative Mode with Data API)

---

## 1. Purpose

This document defines the routing architecture for CampusCare. It covers route organization, public vs. protected vs. permission-gated routes, lazy loading strategy, route metadata, and the relationship between the router and the authentication/authorization system.

---

## 2. Router Strategy: `createBrowserRouter` (Data API Mode)

**Decision:** Use `createBrowserRouter` + `RouterProvider` (not `BrowserRouter`).

**Why:**
- The Data API mode enables `loader` functions for data fetching before render
- Enables nested layouts with `<Outlet />` — single pattern for all layouts
- `errorElement` per-route enables route-level error boundaries without extra wrappers
- Future compatibility with React Router middleware (v8 default feature)
- Better code-splitting integration with `lazy()`

**Constraint:** The router object must be created **outside** the React render tree (as a module-level constant), because Data Router fetches data before React renders.

---

## 3. Route Hierarchy

```
/                         (RootLayout — provides global context)
├── /login                (AuthLayout — public only)
├── /register             (AuthLayout — public only)
├── /403                  (ForbiddenPage — public)
├── /404                  (NotFoundPage — public)
│
└── /dashboard/*          (AppLayout — requires authentication)
    ├── /dashboard         (DashboardPage)
    ├── /tickets
    │   ├── /tickets/mine  (MyTicketsPage — requires: tickets:read_own)
    │   ├── /tickets        (AllTicketsPage — requires: tickets:read_all)
    │   ├── /tickets/new    (NewTicketPage — requires: tickets:create)
    │   └── /tickets/:id    (TicketDetailPage — requires: tickets:read_own)
    ├── /assets
    │   ├── /assets         (AssetListPage — requires: assets:read)
    │   ├── /assets/new     (NewAssetPage — requires: assets:create)
    │   └── /assets/:id     (AssetDetailPage — requires: assets:read)
    ├── /inventory          (requires: inventory:read)
    ├── /incidents          (requires: tickets:read_all)
    ├── /reports            (requires: reports:view)
    ├── /analytics          (requires: reports:view)
    ├── /knowledge-base     (public within app)
    ├── /users              (requires: users:read)
    ├── /departments        (requires: departments:manage)
    ├── /settings           (requires: settings:manage)
    ├── /audit              (requires: audit:read)
    └── /profile            (no extra permission, own profile)
```

---

## 4. Route Definitions File

```typescript
// app/router/routes.tsx
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";

// Layouts
import { AppLayout } from "@/app/layouts/AppLayout";
import { AuthLayout } from "@/app/layouts/AuthLayout";

// Guards
import { ProtectedRoute } from "@/app/guards/ProtectedRoute";
import { PublicOnlyRoute } from "@/app/guards/PublicOnlyRoute";
import { PermissionGuard } from "@/app/guards/PermissionGuard";

// Eager-loaded pages (critical path)
import { LoginPage } from "@/features/auth/pages/LoginPage";

// Lazy-loaded pages (code-split)
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const MyTicketsPage = lazy(() => import("@/features/tickets/pages/MyTicketsPage"));
const AllTicketsPage = lazy(() => import("@/features/tickets/pages/AllTicketsPage"));
const TicketDetailPage = lazy(() => import("@/features/tickets/pages/TicketDetailPage"));
const NewTicketPage = lazy(() => import("@/features/tickets/pages/NewTicketPage"));
const AssetListPage = lazy(() => import("@/features/assets/pages/AssetListPage"));
// ... other lazy pages

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  // Public routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>,
      },
      {
        path: "/register",
        element: <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>,
      },
    ],
  },
  // Error pages
  { path: "/403", element: <ForbiddenPage /> },
  { path: "/404", element: <NotFoundPage /> },
  // Protected application routes
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/dashboard",
        element: <Suspense fallback={<PageSkeleton />}><DashboardPage /></Suspense>,
      },
      // Tickets — requires tickets:read_own minimum
      {
        path: "/tickets",
        children: [
          {
            index: true,
            element: (
              <PermissionGuard requiredPermissions={["tickets:read_all"]}>
                <Suspense fallback={<PageSkeleton />}><AllTicketsPage /></Suspense>
              </PermissionGuard>
            ),
          },
          {
            path: "mine",
            element: (
              <PermissionGuard requiredPermissions={["tickets:read_own"]}>
                <Suspense fallback={<PageSkeleton />}><MyTicketsPage /></Suspense>
              </PermissionGuard>
            ),
          },
          {
            path: "new",
            element: (
              <PermissionGuard requiredPermissions={["tickets:create"]}>
                <Suspense fallback={<PageSkeleton />}><NewTicketPage /></Suspense>
              </PermissionGuard>
            ),
          },
          {
            path: ":ticketId",
            element: (
              <PermissionGuard requiredPermissions={["tickets:read_own"]}>
                <Suspense fallback={<PageSkeleton />}><TicketDetailPage /></Suspense>
              </PermissionGuard>
            ),
          },
        ],
      },
      // ... other route groups
    ],
  },
  // Catch-all
  { path: "*", element: <Navigate to="/404" replace /> },
]);
```

---

## 5. Route Guard Types

### 5.1 `ProtectedRoute` — Authentication Required
Checks if the user is authenticated. If not, redirects to `/login`.  
If session is still loading, shows a `PageLoader` (skeleton, not spinner).

```tsx
// app/guards/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return <PageLoader />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

**Note:** The `state={{ from: location }}` enables post-login redirect back to the originally requested page.

### 5.2 `PublicOnlyRoute` — Redirects Authenticated Users
If the user is already logged in, redirect them away from `/login` and `/register`.

```tsx
// app/guards/PublicOnlyRoute.tsx
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

### 5.3 `PermissionGuard` — Permission Required
Checks if the user has the required permission(s). Falls back to `/403` if not.

See [RBAC.md](./RBAC.md) §8 for full specification.

---

## 6. Lazy Loading Strategy

**Principle:** Every page component is lazy-loaded. Only the top-level layout components and the `LoginPage` are eagerly loaded.

```typescript
// Pattern for all page lazy imports:
const TicketListPage = lazy(
  () => import("@/features/tickets/pages/TicketListPage")
);

// Wrapping at the route level:
element: <Suspense fallback={<PageSkeleton />}><TicketListPage /></Suspense>
```

**`PageSkeleton`:** A full-page skeleton that matches the page layout (not a spinner). This prevents layout shift when the component loads.

**Why not React Router's `lazy` option?** The route-level lazy option is better suited for framework mode (SSR). In SPA mode, `React.lazy` + `Suspense` gives equivalent results with clearer colocation.

---

## 7. Post-Login Redirect

When a user accesses a protected route while unauthenticated:

1. `ProtectedRoute` saves `location` in navigation state: `state={{ from: location }}`
2. User is redirected to `/login`
3. On successful login, `AuthService.login()` reads `location.state?.from`
4. Router navigates to the original URL if available, or falls back to `/dashboard`

```typescript
// In LoginPage after successful login:
const navigate = useNavigate();
const location = useLocation();
const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
navigate(from, { replace: true });
```

---

## 8. Route Error Handling

Each protected route group has an `errorElement` that catches thrown errors from loaders and renders a contextual error UI.

```tsx
// app/guards/RouteErrorBoundary.tsx
export function RouteErrorBoundary() {
  const error = useRouteError();
  // ... renders appropriate error UI based on error type
}
```

For 404s within the app, the catch-all route `path: "*"` redirects to `/404`.

---

## 9. Navigation Utilities

### Programmatic Navigation
Always use `useNavigate()` from React Router — never `window.location.href` (it causes a full page reload and loses app state).

### Link vs. Button
- Use `<Link to="...">` for navigation that should be a real URL
- Use `<Button onClick={() => navigate(...)}>` for conditional/programmatic navigation only

### `useSearchParams`
For filter, sort, and pagination state that should be bookmarkable:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const status = searchParams.get("status") ?? "open";
```

---

## 10. Breadcrumb Route Metadata

Breadcrumbs are derived from a route metadata map (not from `useMatches` dynamic data, to keep it simple):

```typescript
// app/router/breadcrumb-config.ts
export const BREADCRUMB_CONFIG: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [{ label: "Dashboard" }],
  "/tickets": [{ label: "All Tickets" }],
  "/tickets/mine": [{ label: "My Tickets" }],
  "/tickets/new": [
    { label: "Tickets", href: "/tickets" },
    { label: "New Ticket" }
  ],
  "/assets": [{ label: "Assets" }],
  // Dynamic segments use patterns:
  // "/tickets/:ticketId" → resolved with real data from page component
};
```

---

## 11. React Router v8 Key Behaviors (vs v7)

| Feature | v7 | v8 (Current) |
|:---|:---|:---|
| Middleware | Future flag (opt-in) | Default, built-in |
| Baseline | Node 18+, React 18+ | Node 22+, React 19+ |
| `BrowserRouter` | Available | Available (declarative mode) |
| `createBrowserRouter` | Available | Recommended (data mode) |
| Route lazy loading | Via `route.lazy` | Via `React.lazy` + `Suspense` (SPA) |

**Our stack already meets v8 requirements:** React 19.x, Vite 8.x, Node 22+.

---

## 12. Future Extensibility

- **Server-Side Rendering (SSR):** Switching to React Router Framework mode only requires adding a Vite plugin and creating `entry.server.tsx`. The route definitions remain the same.
- **Route-level data prefetching:** Add `loader` functions to routes when TanStack Query prefetching is insufficient.
- **Parallel routes:** Use nested `<Outlet />` for side-by-side layouts (e.g., master-detail views on desktop).
