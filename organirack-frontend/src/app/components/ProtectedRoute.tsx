import { Navigate } from "react-router";
import { isAuthenticated } from "../lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const hasValidSession = isAuthenticated();

  if (!hasValidSession) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
