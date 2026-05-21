import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredPlayerToken } from "../utils/playerAuth.js";

export default function ProtectedRoute() {
  const location = useLocation();
  const token = getStoredPlayerToken();

  if (!token) {
    const redirectTo = location.pathname + location.search;
    return <Navigate to="/login" state={{ redirectTo }} replace />;
  }

  return <Outlet />;
}
