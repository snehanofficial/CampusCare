import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";

// Layouts
import { AppLayout } from "../layouts/AppLayout.js";
import { AuthLayout } from "../layouts/AuthLayout.js";

// Guards
import { ProtectedRoute } from "../guards/ProtectedRoute.js";
import { PublicOnlyRoute } from "../guards/PublicOnlyRoute.js";
import { PermissionGuard } from "../guards/PermissionGuard.js";
import { RouteErrorBoundary } from "../guards/RouteErrorBoundary.js";

// Eagerly Loaded Core Pages
import { LoginPage } from "../../features/auth/pages/LoginPage.js";
import { RegisterPage } from "../../features/auth/pages/RegisterPage.js";
import { NotFoundPage } from "../../features/errors/pages/NotFoundPage.js";
import { ForbiddenPage } from "../../features/errors/pages/ForbiddenPage.js";

// Lazy Loaded Lazy Pages for optimization
const DashboardPage = lazy(() => import("../../features/dashboard/pages/DashboardPage.js"));
const PlaygroundPage = lazy(() => import("../../features/dashboard/pages/Playground.js"));
const SessionsPage = lazy(() => import("../../features/profile/pages/SessionsPage.js"));
const UnauthorizedPage = lazy(() => import("../../features/errors/pages/UnauthorizedPage.js"));
const ServerErrorPage = lazy(() => import("../../features/errors/pages/ServerErrorPage.js"));
const ErrorMaintenancePage = lazy(() => import("../../features/errors/pages/MaintenancePage.js"));

// Dynamic feature components
const TicketsPage = lazy(() => import("../../features/tickets/pages/TicketsPage.js"));
const IncidentsPage = lazy(() => import("../../features/incidents/pages/IncidentsPage.js"));
const AssetsPage = lazy(() => import("../../features/assets/pages/AssetsPage.js"));
const AssetDetailPage = lazy(() => import("../../features/assets/pages/AssetDetailPage.js"));
const MaintenancePage = lazy(() => import("../../features/maintenance/pages/MaintenancePage.js"));
const InventoryPage = lazy(() => import("../../features/inventory/pages/InventoryPage.js"));
const ReportsPage = lazy(() => import("../../features/reports/pages/ReportsPage.js"));
const AnalyticsPage = lazy(() => import("../../features/analytics/pages/AnalyticsPage.js"));
const KnowledgeBasePage = lazy(() => import("../../features/knowledge-base/pages/KnowledgeBasePage.js"));
const UsersPage = lazy(() => import("../../features/users/pages/UsersPage.js"));
const DepartmentsPage = lazy(() => import("../../features/departments/pages/DepartmentsPage.js"));
const CategoriesPage = lazy(() => import("../../features/categories/pages/CategoriesPage.js"));
const AuditPage = lazy(() => import("../../features/audit/pages/AuditPage.js"));
const SettingsPage = lazy(() => import("../../features/settings/pages/SettingsPage.js"));
const ProfilePage = lazy(() => import("../../features/profile/pages/ProfilePage.js"));
const ServiceStatusPage = lazy(() => import("../../features/service-status/pages/ServiceStatusPage.js"));
const NotificationsPage = lazy(() => import("../../features/notifications/pages/NotificationsPage.js"));

// Skeleton loader
import { PageSkeleton } from "../../components/feedback/PageSkeleton.js";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  // Publicly Accessible Auth Routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
    ],
  },
  // Static Error Boundary Fallback pages
  {
    path: "401",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: "403",
    element: <ForbiddenPage />,
  },
  {
    path: "404",
    element: <NotFoundPage />,
  },
  {
    path: "500",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <ServerErrorPage />
      </Suspense>
    ),
  },
  {
    path: "maintenance",
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <ErrorMaintenancePage />
      </Suspense>
    ),
  },
  // Protected Application Shell Context
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "service-status",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ServiceStatusPage />
          </Suspense>
        ),
      },
      {
        path: "notifications",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: "tickets/mine",
        element: (
          <PermissionGuard requiredPermissions={["tickets:read_own"]}>
            <Suspense fallback={<PageSkeleton />}>
              <TicketsPage mineOnly={true} />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "tickets",
        element: (
          <PermissionGuard requiredPermissions={["tickets:read_all"]}>
            <Suspense fallback={<PageSkeleton />}>
              <TicketsPage mineOnly={false} />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "incidents",
        element: (
          <PermissionGuard requiredPermissions={["tickets:read_all"]}>
            <Suspense fallback={<PageSkeleton />}>
              <IncidentsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "assets",
        element: (
          <PermissionGuard requiredPermissions={["assets:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <AssetsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "assets/:id",
        element: (
          <PermissionGuard requiredPermissions={["assets:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <AssetDetailPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "maintenance",
        element: (
          <PermissionGuard requiredPermissions={["assets:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <MaintenancePage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <PermissionGuard requiredPermissions={["inventory:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <InventoryPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "reports",
        element: (
          <PermissionGuard requiredPermissions={["reports:view"]}>
            <Suspense fallback={<PageSkeleton />}>
              <ReportsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "analytics",
        element: (
          <PermissionGuard requiredPermissions={["reports:view"]}>
            <Suspense fallback={<PageSkeleton />}>
              <AnalyticsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "knowledge-base",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <KnowledgeBasePage />
          </Suspense>
        ),
      },
      {
        path: "users",
        element: (
          <PermissionGuard requiredPermissions={["users:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <UsersPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "departments",
        element: (
          <PermissionGuard requiredPermissions={["departments:manage"]}>
            <Suspense fallback={<PageSkeleton />}>
              <DepartmentsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "categories",
        element: (
          <PermissionGuard requiredPermissions={["categories:manage"]}>
            <Suspense fallback={<PageSkeleton />}>
              <CategoriesPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "audit",
        element: (
          <PermissionGuard requiredPermissions={["audit:read"]}>
            <Suspense fallback={<PageSkeleton />}>
              <AuditPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <PermissionGuard requiredPermissions={["settings:manage"]}>
            <Suspense fallback={<PageSkeleton />}>
              <SettingsPage />
            </Suspense>
          </PermissionGuard>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "profile/sessions",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <SessionsPage />
          </Suspense>
        ),
      },
      {
        path: "playground",
        element: (
          <Suspense fallback={<PageSkeleton />}>
            <PlaygroundPage />
          </Suspense>
        ),
      },
    ],
  },
  // Fallback Catch All Router
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);
