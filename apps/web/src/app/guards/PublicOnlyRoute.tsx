import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { PageLoader } from "../../components/feedback/PageLoader.js";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return <PageLoader />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
