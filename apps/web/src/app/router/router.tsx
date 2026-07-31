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
const MaintenancePage = lazy(() => import("../../features/errors/pages/MaintenancePage.js"));

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
        <MaintenancePage />
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
      // Placeholders for other routes so menu links compile/work correctly
      {
        path: "tickets/mine",
        element: (
          <PermissionGuard requiredPermissions={["tickets:read_own"]}>
            <div className="p-6 bg-card border rounded-lg">My Tickets Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "tickets",
        element: (
          <PermissionGuard requiredPermissions={["tickets:read_all"]}>
            <div className="p-6 bg-card border rounded-lg">All Tickets Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "assets",
        element: (
          <PermissionGuard requiredPermissions={["assets:read"]}>
            <div className="p-6 bg-card border rounded-lg">Assets Management Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <PermissionGuard requiredPermissions={["inventory:read"]}>
            <div className="p-6 bg-card border rounded-lg">Inventory Tracking Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "reports",
        element: (
          <PermissionGuard requiredPermissions={["reports:view"]}>
            <div className="p-6 bg-card border rounded-lg">Reports & Analytics Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "knowledge-base",
        element: <div className="p-6 bg-card border rounded-lg">Knowledge Base Catalog Page Scaffold</div>,
      },
      {
        path: "users",
        element: (
          <PermissionGuard requiredPermissions={["users:read"]}>
            <div className="p-6 bg-card border rounded-lg">Users Administration Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "departments",
        element: (
          <PermissionGuard requiredPermissions={["departments:manage"]}>
            <div className="p-6 bg-card border rounded-lg">Departments Configuration Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "audit",
        element: (
          <PermissionGuard requiredPermissions={["audit:read"]}>
            <div className="p-6 bg-card border rounded-lg">Security Audit Logs Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <PermissionGuard requiredPermissions={["settings:manage"]}>
            <div className="p-6 bg-card border rounded-lg">Global Settings Configuration Page Scaffold</div>
          </PermissionGuard>
        ),
      },
      {
        path: "profile",
        element: <div className="p-6 bg-card border rounded-lg">User Profile Information Page Scaffold</div>,
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
