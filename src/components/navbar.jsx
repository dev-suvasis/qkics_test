// src/components/navbar.jsx
import { useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaUser, FaKey, FaSignOutAlt, FaSearch, FaTimes, FaFileAlt, FaAddressBook, FaBars } from "react-icons/fa";
import { FaUsersGear, FaCrown } from "react-icons/fa6";
import { IoChatboxEllipses } from "react-icons/io5";
import { MdNotificationsActive } from "react-icons/md";

import LoginModal from "./auth/login";
import SignupModal from "./auth/signup";
import ChangePasswordModal from "./auth/change_password";
import CreatePostModal from "./posts/create_post";
import MobileBottomNav from "./ui/MobileBottomNav";
import ModalOverlay from "./ui/ModalOverlay";
import useClickOutside from "./hooks/useClickOutside";

import {
  faHouse,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

function Navbar({ theme, onToggleTheme, user }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    const base = "flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 text-[10px] font-bold uppercase tracking-wider group";

    if (isDark) {
      return isActive
        ? `${base} bg-neutral-800 text-red-500 shadow-lg shadow-black/40`
        : `${base} text-neutral-400 hover:bg-neutral-800/50 hover:text-white`;
    } else {
      return isActive
        ? `${base} bg-white text-red-600 shadow-md`
        : `${base} text-neutral-500 hover:bg-neutral-100 hover:text-black`;
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdown, setDropdown] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Mobile menu state (if needed in future, currently using bottom nav)

  const isLoggedIn = !!user;

  const [searchMobile, setSearchMobile] = useState(false);

  const clearSearch = () => setSearchQuery("");

  const triggerSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&type=posts`);
    setSearchMobile(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") triggerSearch();
  };

  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setDropdown(false));

  const toggleDropdown = () => setDropdown((v) => !v);

  const goToProfile = () => {
    setDropdown(false);
    if (!user) return navigate("/normal");
    if (user.user_type === "expert") navigate("/expert");
    else if (user.user_type === "entrepreneur") navigate("/entrepreneur");
    else if (user.user_type === "investor") navigate("/investor");
    else if (user.user_type === "admin") navigate("/admin");
    else if (user.user_type === "superadmin") navigate("/superadmin");
    else navigate("/normal");
  };

  const handleSearchFocus = () => {
    // Optional: Auto-navigate to search page on focus
    // if (location.pathname !== "/search") navigate("/search");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isDark ? "bg-[#0a0a0a]/80 border-b border-white/5" : "bg-white/80 border-b border-black/5"
          } backdrop-blur-xl supports-[backdrop-filter]:bg-opacity-60`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">

          {/* LEFT: LOGO */}
          <Link to="/" className="flex-shrink-0 group relative">
            <div className={`absolute -inset-2 rounded-xl blur-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? "bg-red-500/20" : "bg-red-500/10"}`}></div>
            <img
              src="/logo.png"
              alt="logo"
              className="h-10 w-auto relative rounded-lg transform transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* MIDDLE: NAVIGATION (Desktop) */}
          <nav className={`hidden lg:flex items-center gap-2 p-1.5 rounded-3xl border backdrop-blur-md ${isDark ? "bg-neutral-900/50 border-white/5" : "bg-neutral-100/50 border-black/5"}`}>
            <Link to="/">
              <button className={getNavClass("/")}>
                <FontAwesomeIcon icon={faHouse} className="text-sm mb-0.5" />
                <span>Home</span>
              </button>
            </Link>

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/booking")}
              className={getNavClass("/booking")}
            >
              <FaUsersGear className="text-sm mb-0.5" />
              <span>Network</span>
            </button>

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/notifications")}
              className={getNavClass("/notifications")}
            >
              <MdNotificationsActive className="text-sm mb-0.5" />
              <span>Alerts</span>
            </button>

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/document")}
              className={getNavClass("/document")}
            >
              <FaFileAlt className="text-sm mb-0.5" />
              <span>Library</span>
            </button>
          </nav>

          {/* RIGHT: ACTIONS */}
          <div className="flex items-center gap-3 flex-1 justify-end">

            {/* SEARCH ICON (Mobile Only) */}
            <button
              onClick={() => setSearchMobile(true)}
              className={`lg:hidden h-11 w-11 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-neutral-800 text-neutral-400" : "bg-neutral-100 text-neutral-500"
                }`}
            >
              <FaSearch size={16} />
            </button>

            {/* SEARCH BAR (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-sm relative group">
              <div className={`flex items-center w-full gap-3 rounded-2xl px-4 py-2.5 transition-all duration-300 border ${isDark
                ? "bg-neutral-900 border-white/5 group-focus-within:border-red-500/50 group-focus-within:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                : "bg-neutral-100 border-transparent group-focus-within:bg-white group-focus-within:shadow-xl"
                }`}>
                <FaSearch className={`transition-colors ${isDark ? "text-neutral-500 group-focus-within:text-red-500" : "text-neutral-400 group-focus-within:text-red-600"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  placeholder="Search discovery..."
                  className={`bg-transparent outline-none w-full text-sm font-medium placeholder:font-normal placeholder:text-neutral-500 ${isDark ? "text-white" : "text-black"}`}
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="hover:text-red-500 transition-colors">
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* PREMIUM BUTTON */}
              <button
                className="hidden xl:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-red-600/30 hover:scale-105 transition-all active:scale-95"
                onClick={() => navigate("/subscription")}
              >
                <FaCrown size={12} />
                <span>Premium</span>
              </button>

              {/* THEME TOGGLE */}
              <button
                onClick={onToggleTheme}
                className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isDark
                  ? "bg-neutral-800 text-yellow-400 hover:bg-neutral-700 hover:text-yellow-300"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black"
                  }`}
              >
                <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="text-lg" />
              </button>

              {!isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLogin(true)}
                    className={`hidden sm:block px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isDark ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowSignup(true)}
                    className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all ${isDark
                      ? "bg-white text-black hover:bg-neutral-200"
                      : "bg-black text-white hover:bg-neutral-800"
                      }`}
                  >
                    Join
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className={`h-11 w-11 rounded-xl overflow-hidden ring-2 ring-offset-2 transition-all duration-300 ${isDark
                      ? "ring-neutral-800 ring-offset-black hover:ring-red-500"
                      : "ring-neutral-200 ring-offset-white hover:ring-red-500"
                      }`}
                  >
                    <img
                      src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  </button>

                  {dropdown && (
                    <div className={`absolute right-0 mt-4 w-72 rounded-3xl shadow-2xl border p-2 animate-pop origin-top-right z-[100] ${isDark
                      ? "bg-[#111] border-neutral-800 shadow-black/80"
                      : "bg-white border-black/5 shadow-xl"
                      }`}>

                      {/* USER INFO HEADER */}
                      <div className={`px-4 py-4 mb-2 mx-1 rounded-2xl ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                        <p className={`font-bold text-base truncate ${isDark ? "text-white" : "text-black"}`}>{user.first_name || user.username}</p>
                        <p className={`text-[10px] opacity-60 uppercase tracking-widest font-black mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>{user.user_type}</p>
                      </div>

                      <div className="space-y-1">
                        <DropdownItem onClick={goToProfile} icon={<FaUser />} label="My Profile" isDark={isDark} />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/chat"); }} icon={<IoChatboxEllipses />} label="Messages" isDark={isDark} />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/my-bookings"); }} icon={<FaAddressBook />} label="My Bookings" isDark={isDark} />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/subscription"); }} icon={<FaCrown />} label="Subscription" isDark={isDark} />
                      </div>

                      <div className={`my-2 mx-3 border-t ${isDark ? "border-white/10" : "border-black/5"}`}></div>

                      <div className="space-y-1">
                        <DropdownItem onClick={() => { setDropdown(false); setShowChangePass(true); }} icon={<FaKey />} label="Security" isDark={isDark} />
                        <DropdownItem onClick={() => { setDropdown(false); navigate("/logout"); }} icon={<FaSignOutAlt />} label="Logout" danger isDark={isDark} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH OVERLAY */}
        {searchMobile && (
          <div className={`lg:hidden absolute inset-0 z-[60] flex items-center px-4 animate-fadeIn ${isDark ? "bg-[#0a0a0a]" : "bg-white"
            }`}>
            <div className={`flex items-center w-full gap-3 rounded-2xl px-4 py-3 border ${isDark ? "bg-neutral-900 border-white/10" : "bg-neutral-100 border-black/5"
              }`}>
              <FaSearch className="text-red-600" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search discovery..."
                className={`bg-transparent outline-none w-full text-sm font-bold ${isDark ? "text-white" : "text-black"}`}
              />
              <button
                onClick={() => { setSearchMobile(false); clearSearch(); }}
                className="h-8 w-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5"
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* AUTH MODALS */}
      {showLogin && (
        <ModalOverlay close={() => setShowLogin(false)}>
          <LoginModal isDark={isDark} onClose={() => setShowLogin(false)} openSignup={() => { setShowLogin(false); setShowSignup(true); }} />
        </ModalOverlay>
      )}

      {showSignup && (
        <ModalOverlay close={() => setShowSignup(false)}>
          <SignupModal isDark={isDark} onClose={() => setShowSignup(false)} openLogin={() => { setShowSignup(false); setShowLogin(true); }} />
        </ModalOverlay>
      )}

      {showChangePass && (
        <ModalOverlay close={() => setShowChangePass(false)}>
          <ChangePasswordModal isDark={isDark} onClose={() => setShowChangePass(false)} />
        </ModalOverlay>
      )}

      {showCreatePost && (
        <ModalOverlay close={() => setShowCreatePost(false)}>
          <CreatePostModal
            isDark={isDark}
            onClose={() => setShowCreatePost(false)}
            onSuccess={() => {
              setShowCreatePost(false);
              // If on home, it might not refresh automatically unless using a global state or simple reload
              if (location.pathname === "/") window.location.reload();
              else navigate("/");
            }}
          />
        </ModalOverlay>
      )}

      {/* MOBILE NAV (Visible only on small screens) */}
      <MobileBottomNav
        theme={theme}
        isLoggedIn={isLoggedIn}
        setShowLogin={setShowLogin}
        onAction={() => setShowCreatePost(true)}
      />

      {/* Spacer for fixed header */}
      <div className="h-24"></div>
    </>
  );
}

function DropdownItem({ onClick, icon, label, danger, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${danger
        ? "text-red-500 hover:bg-red-500/10"
        : isDark
          ? "text-neutral-400 hover:text-white hover:bg-white/5"
          : "text-neutral-500 hover:text-black hover:bg-black/5"
        }`}
    >
      <span className="text-sm opacity-80">{icon}</span>
      {label}
    </button>
  );
}

export default Navbar;


