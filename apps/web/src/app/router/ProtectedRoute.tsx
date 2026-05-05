import { Navigate, Outlet } from "react-router-dom";
import { tokenStorage } from "../../domain/session/tokens";

/** Redirects to /login if no access token is present in the session. */
export function ProtectedRoute() {
  const token = tokenStorage.getAccess();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
