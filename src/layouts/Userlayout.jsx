// src/layouts/UserLayout.jsx
//
// User-side layout wrapper — mirrors the shape of adminLayout.jsx.
//
// Responsibilities:
//   1. Renders the existing Navbar (unchanged file, no rename)
//   2. Owns ALL modal state via UserLayoutContext so pages never need their own
//   3. Renders Login / Signup / ChangePassword / CreatePost modals in one place
//   4. Renders MobileBottomNav
//   5. Renders <Outlet /> for child pages
//
// What it does NOT do:
//   - No auth redirect logic (App.jsx already guards admin routes)
//   - No theme management (App.jsx still owns that)
//   - No search state (Navbar owns its own search)

import { Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { lazy, Suspense } from "react";

import { setTheme } from "../redux/slices/userSlice";
import { addPost } from "../redux/slices/postsSlice";
import { useAlert } from "../context/AlertContext";

import Navbar from "../components/navbar";
import MobileBottomNav from "../components/ui/MobileBottomNav";
import ModalOverlay from "../components/ui/ModalOverlay";
import ErrorBoundary from "../components/Errorboundary";

import { UserLayoutProvider, useUserLayout } from "./Userlayoutcontext";

// Lazy-load modals — they are heavy and rarely needed simultaneously
const LoginModal        = lazy(() => import("../components/auth/login"));
const SignupModal       = lazy(() => import("../components/auth/Signup"));
const ChangePasswordModal = lazy(() => import("../components/auth/change_password"));
const CreatePostModal   = lazy(() => import("../components/posts/create_post"));

// ─── Thin spinner shown while modal chunks download ──────────────────────────
function ModalLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-neutral-300" />
    </div>
  );
}

// ─── Inner component — has access to UserLayoutContext ────────────────────────
function UserLayoutInner() {
  const dispatch       = useDispatch();
  const { showAlert }  = useAlert();
  const { theme, data: user } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const toggleTheme = () => dispatch(setTheme(theme === "dark" ? "light" : "dark"));

  const {
    showLogin, showSignup, showChangePass, showCreatePost,
    openLogin, openCreatePost,
    closeLogin, closeSignup, closeChangePass, closeCreatePost,
    switchToSignup, switchToLogin,
  } = useUserLayout();

  // ── CreatePost success handler ───────────────────────────────────────────
  // Lives here (not in Navbar) so it has direct access to dispatch.
  // Any page that needs it can call openCreatePost() from context.
  const handlePostCreated = (newPost) => {
    dispatch(addPost(newPost));   // prepend to postsSlice.items — no reload
    closeCreatePost();
    showAlert("Post published!", "success");
  };

  return (
    <div className={isDark ? "dark" : ""}>
      {/* ── Top Navbar ─────────────────────────────────────────────────── */}
      {/* Pass openLogin/openCreatePost so Navbar buttons still work.
          Navbar no longer owns modal state — it just calls these. */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onOpenLogin={openLogin}
        onOpenCreatePost={openCreatePost}
      />

      {/* ── Page content ───────────────────────────────────────────────── */}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>

      {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
      {/* Reads openLogin from context instead of taking it as a prop
          from Navbar. Eliminates the prop-drilling chain. */}
      <MobileBottomNav
        theme={theme}
        isLoggedIn={!!user}
        setShowLogin={openLogin}
        onAction={openCreatePost}
      />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {/* All modals live here — one place, no duplication across pages.   */}

      {showLogin && (
        <ModalOverlay close={closeLogin}>
          <Suspense fallback={<ModalLoader />}>
            <LoginModal
              isDark={isDark}
              onClose={closeLogin}
              openSignup={switchToSignup}
            />
          </Suspense>
        </ModalOverlay>
      )}

      {showSignup && (
        <ModalOverlay close={closeSignup}>
          <Suspense fallback={<ModalLoader />}>
            <SignupModal
              isDark={isDark}
              onClose={closeSignup}
              openLogin={switchToLogin}
            />
          </Suspense>
        </ModalOverlay>
      )}

      {showChangePass && (
        <ModalOverlay close={closeChangePass}>
          <Suspense fallback={<ModalLoader />}>
            <ChangePasswordModal
              isDark={isDark}
              onClose={closeChangePass}
            />
          </Suspense>
        </ModalOverlay>
      )}

      {showCreatePost && (
        <ModalOverlay close={closeCreatePost}>
          <Suspense fallback={<ModalLoader />}>
            <CreatePostModal
              isDark={isDark}
              onClose={closeCreatePost}
              onSuccess={handlePostCreated}
            />
          </Suspense>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─── Public export — wraps inner with the context provider ───────────────────
export default function UserLayout() {
  return (
    <UserLayoutProvider>
      <UserLayoutInner />
    </UserLayoutProvider>
  );
}