// src/components/navbar.jsx
import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaHome, FaUser, FaKey, FaSignOutAlt, FaSearch, FaTimes, FaFileAlt, FaAddressBook, FaBars, FaHandshake, FaBuilding, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaUsersGear, FaCrown } from "react-icons/fa6";
import { IoChatboxEllipses } from "react-icons/io5";
import { MdNotificationsActive } from "react-icons/md";

import LoginModal from "./auth/login";
import SignupModal from "./auth/Signup";
import ChangePasswordModal from "./auth/change_password";
import CreatePostModal from "./posts/create_post";
import MobileBottomNav from "./ui/MobileBottomNav";
import ModalOverlay from "./ui/ModalOverlay";
import useClickOutside from "./hooks/useClickOutside";
import { getOwnProfileRoute } from "./utils/getUserProfileRoute";
import { resolveAvatar } from "./utils/mediaUrl";
import { useNotifications } from "../context/NotificationContext";

import {
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

function Navbar({ theme, onToggleTheme, user }) {
  const picVersion = useSelector((state) => state.user.picVersion || 0);
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [entDropdown, setEntDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const desktopSearchRef = useRef(null);

  useClickOutside(desktopSearchRef, () => {
    if (!searchQuery) setIsSearchExpanded(false);
  });

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
    navigate(getOwnProfileRoute(user.user_type));
  };

  const handleSearchFocus = () => {
    // Optional: Auto-navigate to search page on focus
    // if (location.pathname !== "/search") navigate("/search");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isDark ? "bg-[#0a0a0a]/80 border-b border-white/5" : "bg-white/80 border-b border-black/5"
          } backdrop-blur-xl supports-backdrop-filter:bg-opacity-60`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">

          {/* LEFT: LOGO */}
          <Link to="/" className="flex-shrink-0 group relative">
            <div className={`absolute -inset-2 rounded-xl blur-lg transition-all opacity-0 group-hover:opacity-100 ${isDark ? "bg-red-500/20" : "bg-red-500/10"}`}></div>
            <img
              src="/logo.png"
              alt="logo"
              className="h-15 w-auto relative rounded-lg transform transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* MIDDLE: NAVIGATION (Desktop) */}
          <nav className={`hidden lg:flex items-center gap-3 p-1.5 rounded-3xl border backdrop-blur-md transition-all duration-300 ${isDark ? "bg-neutral-900/50 border-white/5" : "bg-neutral-100/50 border-black/5"}`}>
            <Link to="/">
              <button className={getNavClass("/")}
                title="Home"
              >
                {isSearchExpanded && <FaHome className="text-sm animate-fadeIn" />}
                {!isSearchExpanded && <span className="text-xs animate-fadeIn">Home</span>}
              </button>
            </Link>

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/booking")}
              className={getNavClass("/booking")}
              title="Experts"
            >
              {isSearchExpanded && <FaUsersGear className="text-sm animate-fadeIn" />}
              {!isSearchExpanded && <span className="text-xs animate-fadeIn">Experts</span>}
            </button>

            <div
              className="relative h-full flex flex-col justify-center"
              onMouseEnter={() => setEntDropdown(true)}
              onMouseLeave={() => setEntDropdown(false)}
            >
              <button
                // onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/entrepreneur-connect")}
                className={getNavClass("/entrepreneur-connect")}
                title="Entrepreneurial Connect"
              >
                {isSearchExpanded && <FaHandshake className="text-xs animate-fadeIn" />}
                {!isSearchExpanded && (
                  <span className="text-xs animate-fadeIn flex items-center gap-2">
                    ENTREPRENEURIAL CONNECT
                    {entDropdown ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                  </span>
                )}
              </button>

              {entDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[750px] z-50 animate-fadeInOut">
                  <div className={`rounded-3xl shadow-2xl border p-6 flex gap-8 ${isDark ? "bg-neutral-900 border-neutral-800 shadow-black/80" : "bg-white border-black/5 shadow-xl"}`}>
                    <div className="flex-1 flex flex-col pt-1">
                      <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 text-red-600 ml-2`}>Knowledge Hub</h3>
                      <div className="space-y-1">
                        <button onClick={() => { if (!isLoggedIn) setShowLogin(true); else { navigate("/"); setEntDropdown(false); } }} className={`w-full text-left block px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 uppercase tracking-widest ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"}`}>Researched Based Feed</button>
                        <button onClick={() => { if (!isLoggedIn) setShowLogin(true); else { navigate("/document"); setEntDropdown(false); } }} className={`w-full text-left block px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 uppercase tracking-widest ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"}`}>Documents</button>
                      </div>
                    </div>
                    <div className={`w-px ${isDark ? "bg-white/5" : "bg-black/5"}`}></div>
                    <div className="flex-1 flex flex-col pt-1">
                      <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-4 text-red-600 ml-2`}>Investor Linkups</h3>
                      <div className="space-y-1">
                        <button onClick={() => { if (!isLoggedIn) setShowLogin(true); else { navigate("/entrepreneur-connect"); setEntDropdown(false); } }} className={`w-full text-left block px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 uppercase tracking-widest ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"}`}>Investors</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/notifications")}
              className={getNavClass("/notifications")}
              title="Notifications"
            >
              <MdNotificationsActive className="text-sm mb-0.5" />
              <span>Alerts</span>
            </button> */}

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/document")}
              className={getNavClass("/document")}
              title="Documents"
            >
              {isSearchExpanded && <FaFileAlt className="text-sm animate-fadeIn" />}
              {!isSearchExpanded && <span className="text-xs animate-fadeIn">Documents</span>}
            </button>

            <button
              onClick={() => !isLoggedIn ? setShowLogin(true) : navigate("/msmd")}
              className={getNavClass("/mvlksdam")}
              title="Company"
            >
              {isSearchExpanded && <FaBuilding className="text-sm animate-fadeIn" />}
              {!isSearchExpanded && <span className="text-xs animate-fadeIn">Company</span>}
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
            <div className="hidden lg:flex flex-1 justify-end max-w-sm relative group" ref={desktopSearchRef}>
              <div
                onClick={() => setIsSearchExpanded(true)}
                className={`flex items-center transition-all duration-300 overflow-hidden cursor-pointer border ${isSearchExpanded
                  ? `w-full max-w-sm gap-3 rounded-2xl px-4 py-2.5 ${isDark
                    ? "bg-neutral-900 border-white/5 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                    : "bg-white border-transparent shadow-xl"}`
                  : `w-11 h-11 rounded-xl justify-center ${isDark ? "bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700" : "bg-neutral-100 border-transparent text-neutral-500 hover:bg-neutral-200"}`
                  }`}>
                <FaSearch className={`transition-colors flex-shrink-0 ${isSearchExpanded ? (isDark ? "text-red-500" : "text-red-600") : "text-inherit"}`} />

                {isSearchExpanded && (
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search discovery..."
                    className={`bg-transparent outline-none w-full text-sm font-medium placeholder:font-normal placeholder:text-neutral-500 ${isDark ? "text-white" : "text-black"}`}
                  />
                )}

                {isSearchExpanded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (searchQuery) {
                        clearSearch();
                      } else {
                        setIsSearchExpanded(false);
                      }
                    }}
                    className="hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* PREMIUM BUTTON */}
              <button
                className="hidden xl:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-red-600/30 hover:scale-105 transition-all active:scale-95"
                onClick={() => navigate("/subscription")}
              >
                <FaCrown size={12} />
                <span>Premium</span>
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => navigate("/notifications")}
                  className={`${getNavClass("/notifications")} relative`}
                  title="Notifications"
                >
                  <MdNotificationsActive size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}

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
                      src={`${resolveAvatar(user?.profile_picture, user?.username)}${user?.profile_picture ? `?v=${picVersion}` : ""}`}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  </button>

                  {dropdown && (
                    <div className={`absolute right-0 mt-4 w-72 rounded-3xl shadow-2xl border p-2 animate-pop origin-top-right z-100 ${isDark
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
          <div className={`lg:hidden absolute inset-0 z-60 flex items-center px-4 animate-fadeIn ${isDark ? "bg-[#0a0a0a]" : "bg-white"
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
      <div className="h-20"></div>
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