// src/components/navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaUser, FaKey, FaSignOutAlt } from "react-icons/fa";

import LoginModal from "./auth/Login";
import SignupModal from "./auth/Signup";
import ChangePasswordModal from "./auth/change_password";

import {
  faHouse,
  faBell,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

function Navbar({ theme, onToggleTheme, user }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const [dropdown, setDropdown] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  const isLoggedIn = !!user;

  // Sync Input when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // SEARCH TRIGGERED ONLY ON ENTER
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const next = new URLSearchParams(searchParams);
      if (searchQuery.trim()) next.set("search", searchQuery.trim());
      else next.delete("search");

      setSearchParams(next);
    }
  };

  const toggleDropdown = () => setDropdown((v) => !v);

  const goToProfile = () => {
    setDropdown(false);

    if (!user) return navigate("/profile");

    if (user.user_type === "expert") navigate("/expert");
    else if (user.user_type === "entrepreneur") navigate("/entrepreneur");
    else navigate("/profile");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b ${
          isDark
            ? "bg-neutral-900 text-neutral-100 border-neutral-800"
            : "bg-white text-neutral-800 border-neutral-200"
        }`}
      >
        <div className="max-w-6xl mx-auto pr-4 h-14 flex items-center gap-4 relative">

          {/* LOGO */}
          <div className="flex items-center gap-2 mr-2">
            <Link to="/">
              <img className="rounded" src="/logo.png" alt="logo" width="40" />
            </Link>
          </div>

          {/* NAV ICONS */}
          <nav className="flex items-center gap-3 text-xs">
            <Link to="/">
              <button
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
                  isDark
                    ? "text-neutral-100 hover:bg-neutral-800"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <FontAwesomeIcon icon={faHouse} className="h-4 w-4" />
                Home
              </button>
            </Link>

            <Link to="/notifications">
              <button
                className={`hidden md:flex flex-col items-center gap-0.5 px-2 py-1 rounded ${
                  isDark
                    ? "text-neutral-100 hover:bg-neutral-800"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
                Notifications
              </button>
            </Link>
          </nav>

          {/* SEARCH */}
          <div className="flex-1 flex items-center">
            <div className="w-full max-w-md ml-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                  isDark
                    ? "bg-neutral-800 text-neutral-300"
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown} // ENTER ONLY
                  placeholder="Search posts..."
                  className="bg-transparent outline-none w-full text-xs placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3 text-xs">
            {/* Try Q-KICS */}
            <button className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 font-semibold">
              Try Q-KICS +
            </button>

            {/* Logged OUT */}
            {!isLoggedIn && (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className={`px-3 py-1.5 rounded-full ${
                    isDark
                      ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                      : "bg-neutral-200 hover:bg-neutral-300 text-black"
                  }`}
                >
                  Login
                </button>

                <button
                  onClick={() => setShowSignup(true)}
                  className={`px-3 py-1.5 rounded-full ${
                    isDark
                      ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                      : "bg-neutral-300 hover:bg-neutral-400 text-black"
                  }`}
                >
                  Signup
                </button>
              </>
            )}

            {/* Logged IN */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    isDark
                      ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                      : "bg-neutral-200 hover:bg-neutral-300 text-black"
                  }`}
                >
                  <img
                    src={
                      user?.profile_picture
                        ? `${user.profile_picture}?t=${Date.now()}`
                        : `https://ui-avatars.com/api/?name=${
                            user?.first_name || user?.username
                          }&background=random&length=1`
                    }
                    alt="profile"
                    className="rounded-full object-cover h-8 w-8"
                  />
                </button>

                {dropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border ${
                      isDark
                        ? "bg-neutral-800 border-neutral-700 text-white"
                        : "bg-white border-neutral-200 text-black"
                    }`}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={goToProfile}
                    >
                      <FaUser /> My Profile
                    </button>

                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={() => {
                        setDropdown(false);
                        setShowChangePass(true);
                      }}
                    >
                      <FaKey /> Change Password
                    </button>

                    <button
                      onClick={() => {
                        setDropdown(false);
                        navigate("/logout");
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* THEME TOGGLE */}
            <button
              onClick={onToggleTheme}
              className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                isDark
                  ? "border-neutral-500 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                  : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
            </button>
          </div>
        </div>
      </header>

      {/* LOGIN MODAL */}
      {showLogin && (
        <ModalOverlay close={() => setShowLogin(false)}>
          <LoginModal
            isDark={isDark}
            onClose={() => setShowLogin(false)}
            openSignup={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        </ModalOverlay>
      )}

      {/* SIGNUP MODAL */}
      {showSignup && (
        <ModalOverlay close={() => setShowSignup(false)}>
          <SignupModal
            isDark={isDark}
            onClose={() => setShowSignup(false)}
            openLogin={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        </ModalOverlay>
      )}

      {/* CHANGE PASSWORD */}
      {showChangePass && (
        <ModalOverlay close={() => setShowChangePass(false)}>
          <ChangePasswordModal
            isDark={isDark}
            onClose={() => setShowChangePass(false)}
          />
        </ModalOverlay>
      )}
    </>
  );
}

export default Navbar;

/* -------------------------------------
   MODAL BACKDROP
-------------------------------------- */
function ModalOverlay({ children, close }) {
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div onMouseDown={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
