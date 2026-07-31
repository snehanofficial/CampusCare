import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { PageLoader } from "../../components/feedback/PageLoader.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageLoader />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
