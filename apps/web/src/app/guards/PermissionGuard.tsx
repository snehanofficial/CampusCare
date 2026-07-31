import { Navigate } from "react-router";
import { usePermission } from "../../hooks/usePermission.js";

interface PermissionGuardProps {
  requiredPermissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
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
