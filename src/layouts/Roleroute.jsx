// src/layouts/RoleRoute.jsx
//
// Extends ProtectedRoute — requires login AND a specific user_type.
//
// Props:
//   roles     {string[]}  — allowed user_type values, e.g. ["expert"]
//   redirectTo {string}  — where to send unauthorized users (default: "/")
//
// Examples:
//   <Route element={<RoleRoute roles={["expert"]} />}>
//     <Route path="/expert/slots" element={<ExpertSlots />} />
//   </Route>
//
//   <Route element={<RoleRoute roles={["normal", "entrepreneur", "investor"]} redirectTo="/" />}>
//     <Route path="/upgrade/expert" element={<ExpertWizard />} />
//   </Route>

import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRefreshToken } from "../redux/store/tokenManager";

export default function RoleRoute({ roles = [], redirectTo = "/" }) {
  const { data: user, status } = useSelector((state) => state.user);
  const location = useLocation();
  const hasRefreshToken = !!getRefreshToken();

  // ── 1. Actively fetching — wait ──────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
      </div>
    );
  }

  // ── 2. Not logged in at all ──────────────────────────────────────────────
  if (!hasRefreshToken && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ── 3. Refresh token exists but user not loaded yet ──────────────────────
  if (!user && hasRefreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
      </div>
    );
  }

  // ── 4. Logged in but wrong role ──────────────────────────────────────────
  if (roles.length > 0 && !roles.includes(user.user_type)) {
    return <Navigate to={redirectTo} replace />;
  }

  // ── 5. Correct role — render the child route ─────────────────────────────
  return <Outlet />;
}