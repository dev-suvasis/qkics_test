// src/redux/store/tokenManager.js
//
// TOKEN STORAGE STRATEGY
// ──────────────────────
// Access token  → sessionStorage
//   Short-lived (minutes). Scoped to the tab. Gone when tab closes.
//   Fast to read with no network round-trip.
//
// Refresh token → cookie (js-set, NOT httpOnly since the backend sends it
//   in the response body rather than setting it server-side)
//   Long-lived (days). Persists across page refreshes and tab closes.
//   SameSite=Strict prevents CSRF. We clear it explicitly on logout.

const ACCESS_KEY = "access_token";
const REFRESH_COOKIE = "refresh_token";

/* ─── Access Token (sessionStorage) ─── */

export const setAccessToken = (token) => {
  if (token) {
    sessionStorage.setItem(ACCESS_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_KEY);
  }
};

export const getAccessToken = () => {
  return sessionStorage.getItem(ACCESS_KEY) || null;
};

/* ─── Refresh Token (cookie) ─── */

export const setRefreshToken = (token) => {
  if (token) {
    // Read the expiry directly from the JWT's `exp` claim so the cookie
    // lifetime always matches whatever the backend has configured —
    // no hardcoded values needed on the frontend.
    let expires = "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.exp) {
        expires = `; expires=${new Date(payload.exp * 1000).toUTCString()}`;
      }
    } catch {
      // Malformed token — let the cookie be session-scoped (no expires)
    }
    document.cookie = `${REFRESH_COOKIE}=${token}${expires}; path=/; SameSite=Strict`;
  } else {
    // Remove by setting expiry in the past
    document.cookie = `${REFRESH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  }
};

export const getRefreshToken = () => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REFRESH_COOKIE}=`));
  return match ? match.split("=")[1] : null;
};

/* ─── Clear everything ─── */

export const clearAllTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
  // Also clear any legacy keys that may have been set before
  sessionStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem("user_uuid");
};