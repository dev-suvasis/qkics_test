// src/layouts/UserLayoutContext.jsx
//
// Single source of truth for all user-side modal state.
// Any page inside UserLayout can call openLogin(), openCreatePost() etc.
// without prop-drilling through the navbar or lifting state into App.jsx.
//
// Usage in any child page:
//   const { openLogin, openCreatePost } = useUserLayout();

import { createContext, useContext, useState, useCallback } from "react";

const UserLayoutContext = createContext(null);

export const useUserLayout = () => {
  const ctx = useContext(UserLayoutContext);
  if (!ctx) throw new Error("useUserLayout must be used inside UserLayout");
  return ctx;
};

export function UserLayoutProvider({ children }) {
  // ── Modal visibility ──────────────────────────────────────────────────────
  const [showLogin, setShowLogin]           = useState(false);
  const [showSignup, setShowSignup]         = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // ── Stable openers / closers (useCallback so they never cause re-renders) ─
  const openLogin       = useCallback(() => setShowLogin(true),       []);
  const closeLogin      = useCallback(() => setShowLogin(false),      []);

  const openSignup      = useCallback(() => setShowSignup(true),      []);
  const closeSignup     = useCallback(() => setShowSignup(false),     []);

  const openChangePass  = useCallback(() => setShowChangePass(true),  []);
  const closeChangePass = useCallback(() => setShowChangePass(false), []);

  const openCreatePost  = useCallback(() => setShowCreatePost(true),  []);
  const closeCreatePost = useCallback(() => setShowCreatePost(false), []);

  // ── Convenience switchers used by Login ↔ Signup links ───────────────────
  const switchToSignup = useCallback(() => {
    setShowLogin(false);
    setShowSignup(true);
  }, []);

  const switchToLogin = useCallback(() => {
    setShowSignup(false);
    setShowLogin(true);
  }, []);

  return (
    <UserLayoutContext.Provider
      value={{
        // state (read-only — use the openers/closers below)
        showLogin,
        showSignup,
        showChangePass,
        showCreatePost,

        // openers
        openLogin,
        openSignup,
        openChangePass,
        openCreatePost,

        // closers
        closeLogin,
        closeSignup,
        closeChangePass,
        closeCreatePost,

        // switchers
        switchToSignup,
        switchToLogin,
      }}
    >
      {children}
    </UserLayoutContext.Provider>
  );
}