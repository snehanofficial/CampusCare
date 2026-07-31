import { usePermission } from "../../hooks/usePermission.js";

interface CanProps {
  perform: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ perform, requireAll = true, children, fallback = null }: CanProps) {
  const { hasPermission, hasAnyPermission } = usePermission();
  const permissions = Array.isArray(perform) ? perform : [perform];

  const allowed = requireAll
    ? hasPermission(...permissions)
    : hasAnyPermission(...permissions);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
export default Can;
