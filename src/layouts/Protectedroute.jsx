// src/layouts/ProtectedRoute.jsx
//
// Wraps any route that requires the user to be logged in.
//
// Auth flow on page load/refresh:
//   1. status === "loading"  → App.jsx is running silentRefresh + fetchUserProfile
//                              Show spinner, don't redirect yet.
//   2. No refresh token cookie AND no user in Redux
//                            → Definitely logged out. Redirect immediately.
//   3. status === "success" or "error", user exists → let through
//   4. status === "idle", no user, but refresh token exists
//                            → silentRefresh is still running. Keep waiting.
//
// Why check the refresh token cookie and not just `user`?
// On every page refresh, sessionStorage is cleared so the access token is
// gone. App.jsx calls silentRefresh() which is async — Redux status briefly
// sits at "idle" with no user while it runs. Without the cookie check we'd
// flash a redirect and then immediately send the user to / for no reason.

import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { getRefreshToken } from "../redux/store/tokenManager";

export default function ProtectedRoute() {
  const { data: user, status } = useSelector((state) => state.user);
  const location = useLocation();
  const hasRefreshToken = !!getRefreshToken();

  // ── 1. Actively fetching — wait, don't redirect ──────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
      </div>
    );
  }

  // ── 2. No refresh token + no user = definitively logged out ──────────────
  // Preserve where they were trying to go so we can redirect back after login.
  if (!hasRefreshToken && !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ── 3. Refresh token exists but user not loaded yet (silentRefresh running)
  if (!user && hasRefreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-800" />
      </div>
    );
  }

  // ── 4. Logged in — render the child route ────────────────────────────────
  return <Outlet />;
}