import { useCallback } from "react";
import { useAuth } from "./useAuth.js";

export function usePermission() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const role = user?.role ?? null;

  const hasPermission = useCallback(
    (...required: string[]) => {
      return required.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...required: string[]) => {
      return required.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const hasRole = useCallback(
    (...roles: string[]) => {
      return role !== null && roles.includes(role);
    },
    [role]
  );

  return {
    permissions,
    role,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
