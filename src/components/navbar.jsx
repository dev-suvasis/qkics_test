// src/components/navbar.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaUser, FaKey, FaSignOutAlt } from "react-icons/fa";
import { FaUsersGear } from "react-icons/fa6";
import { FaCrown } from "react-icons/fa";
import { IoChatboxEllipses } from "react-icons/io5";
import { MdNotificationsActive } from "react-icons/md";
import { FaAddressBook } from "react-icons/fa";
import { FaSearch, FaTimes } from "react-icons/fa";


import LoginModal from "./auth/Login";
import SignupModal from "./auth/Signup";
import ChangePasswordModal from "./auth/change_password";
import MobileBottomNav from "./ui/MobileBottomNav";
import ModalOverlay from "./ui/ModalOverlay";
import useSearchPosts from "./hooks/useSearch";


import {
  faHouse,
  faBell,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

function Navbar({ theme, onToggleTheme, user }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showSuggestions, setShowSuggestions] = useState(false);

  const { searchPosts, results, loading } = useSearchPosts();



  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    const base = "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium";

    if (isDark) {
      return isActive
        ? `${base} bg-neutral-800 text-white`
        : `${base} text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200`;
    } else {
      return isActive
        ? `${base} bg-neutral-200 text-neutral-900`
        : `${base} text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900`;
    }
  };

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

  useEffect(() => {
  if (searchQuery.trim().length < 3) {
    setShowSuggestions(false);
    return;
  }

  const delay = setTimeout(() => {
    searchPosts(searchQuery);
    setShowSuggestions(true);
  }, 300);

  return () => clearTimeout(delay);
}, [searchQuery]);

const triggerSearch = () => {
  setShowSuggestions(false);

  const next = new URLSearchParams(searchParams);

  if (searchQuery.trim()) {
    next.set("search", searchQuery.trim());
  } else {
    next.delete("search");
  }

  setSearchParams(next);
};

const clearSearch = () => {
  setSearchQuery("");
  setShowSuggestions(false);

  const next = new URLSearchParams(searchParams);
  next.delete("search");

  setSearchParams(next);
};



  // SEARCH TRIGGERED ONLY ON ENTER
 const handleSearchKeyDown = (e) => {
  if (e.key === "Enter") {
    triggerSearch();
  }
};



useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".max-w-md")) {
      setShowSuggestions(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// ⬇️⬇️⬇️ PUT CODE HERE ⬇️⬇️⬇️

const normalizedQuery = searchQuery.toLowerCase();

const tagSuggestions = [];
const postSuggestions = [];

results.forEach((item) => {
  // TAG MATCHES
  if (Array.isArray(item.tags)) {
    item.tags.forEach((tagObj) => {
  const tag =
    typeof tagObj === "string"
      ? tagObj
      : tagObj.name || tagObj.tag || "";

  if (
    tag &&
    tag.toLowerCase().includes(normalizedQuery) &&
    !tagSuggestions.includes(tag)
  ) {
    tagSuggestions.push(tag);
  }
});

  }

  // TITLE MATCH
  if (item.title?.toLowerCase().includes(normalizedQuery)) {
    postSuggestions.push({
      type: "title",
      item,
    });
  }
  // CONTENT MATCH
  else if (item.content?.toLowerCase().includes(normalizedQuery)) {
    postSuggestions.push({
      type: "content",
      item,
    });
  }
});

// FINAL SUGGESTION LIST (MAX 12)
const suggestions = [
  ...tagSuggestions.slice(0, 5).map((tag) => ({
    type: "tag",
    value: tag,
  })),
  ...postSuggestions.slice(0, 7),
];





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

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b ${isDark
          ? "bg-neutral-900 text-neutral-100 border-neutral-800"
          : "bg-white text-neutral-800 border-neutral-200"
          }`}
      >
        <div className="max-w-6xl mx-auto pr-4 h-14 flex items-center gap-1 md:gap-4 relative">

          {/* LOGO */}
          <div className="flex items-center gap-2 mr-0 md:mr-1">
            <Link to="/">
              <img className="rounded" src="/logo.png" alt="logo" width="70" />
            </Link>
          </div>

          {/* NAV ICONS */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/">
              <button className={getNavClass("/")}>
                <FontAwesomeIcon icon={faHouse} className="h-4 w-4 mb-0.5" />
                Home
              </button>
            </Link>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLogin(true);
                } else {
                  navigate("/booking");
                }
              }}
              className={getNavClass("/booking")}
            >
              <FaUsersGear className="h-4 w-4 mb-0.5" />
              Professsionals
            </button>

            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLogin(true);
                } else {
                  navigate("/notifications");
                }
              }}
              className={`hidden md:flex ${getNavClass("/notifications")}`}
            >
              <MdNotificationsActive  icon={faBell} className="h-4 w-4 mb-0.5" />
              Notifications
            </button>
          </nav>

          {/* SEARCH */}
<div className="flex-1 flex items-center">
  <div className="w-full max-w-md ml-0 mr-2 relative">

    {/* SEARCH BAR */}
    <div
      className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${
        isDark
          ? "bg-neutral-800 text-neutral-200"
          : "bg-neutral-200 text-neutral-900"
      }`}
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        placeholder="Search posts..."
        className="bg-transparent outline-none w-full text-xs pr-10"
      />

      {/* ICONS (RIGHT SIDE) */}
      {searchQuery.length > 0 && (
        <div className="flex items-center gap-2">
          <button
        onClick={triggerSearch}
        className="text-neutral-400 hover:text-red-400"
        title="Search"
      >
        <FaSearch size={12} />
      </button>
          <button
        onClick={clearSearch}
        className="text-neutral-400 hover:text-red-400"
        title="Clear"
      >
        <FaTimes size={12} />
      </button>
        </div>
      )}
    </div>

    {/* DROPDOWN (WIDTH = SEARCH BAR) */}
    {showSuggestions && (
      <div
        className={`absolute left-0 top-full mt-1 w-full rounded-lg shadow-lg z-50 border ${
          isDark
            ? "bg-neutral-800 border-neutral-700"
            : "bg-white border-neutral-200"
        }`}
      >
        {loading && (
          <div className="p-3 text-xs text-neutral-400">
            Searching...
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="p-3 text-xs text-neutral-400">
            No results found
          </div>
        )}

        {!loading &&
  suggestions.map((s, index) => {
    // TAG SUGGESTION
    if (s.type === "tag") {
      return (
        <button
          key={`tag-${index}`}
          onClick={() => {
            setShowSuggestions(false);
            const next = new URLSearchParams(searchParams);
            next.set("search", s.value);
            setSearchParams(next);
          }}
          className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-700/20"
        >
          <p className="font-medium ">
            Tag : {s.value}
          </p>
        </button>
      );
    }

    // POST SUGGESTION
    return (
      <button
        key={s.item.id}
        onClick={() => {
          setShowSuggestions(false);
          const next = new URLSearchParams(searchParams);
          next.set("search", s.item.title);
          setSearchParams(next);
        }}
        className="w-full text-left px-4 py-2 text-xs hover:bg-neutral-700/20"
      >
        <p className="font-medium truncate">
          Title : {s.item.title}
        </p>

        {s.type === "content" && (
          <p className="text-[10px] text-neutral-400">
            Matched in content
          </p>
        )}
      </button>
    );
  })}

      </div>
    )}
  </div>
</div>


          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3 text-xs">
            {/* Try Q-KICS */}
            <button className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold" 
            onClick={() => navigate("/subscription")}>
              Try Q-KICS +
            </button>


            {/* THEME TOGGLE */}
            <button
              onClick={onToggleTheme}
              className={`h-8 w-8 rounded-full border flex items-center justify-center ${isDark
                ? "border-neutral-500 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                }`}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
            </button>

            {/* Logged OUT */}
            {!isLoggedIn && (
              <>
                <button
                  onClick={() => setShowLogin(true)}
                  className={`px-3 py-1.5 rounded text-[10px] md:text-xs ${isDark
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-neutral-300 hover:bg-neutral-400 text-black"
                    }`}
                >
                  Login
                </button>

                <button
                  onClick={() => setShowSignup(true)}
                  className={`px-3 py-1.5 rounded text-[10px] md:text-xs ${isDark
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-neutral-300 hover:bg-neutral-400 text-black"
                    }`}
                >
                  <span className="hidden md:inline">Signup</span>
                  <span className="md:hidden">Signup</span>
                </button>
              </>
            )}

            {/* Logged IN */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark
                    ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                    : "bg-neutral-200 hover:bg-neutral-300 text-black"
                    }`}
                >
                  <img
                    src={
                      user?.profile_picture
                        ? `${user.profile_picture}?t=${Date.now()}`
                        : `https://ui-avatars.com/api/?name=${user?.first_name || user?.username
                        }&background=random&length=1`
                    }
                    alt="profile"
                    className="rounded-full object-cover h-8 w-8"
                  />
                </button>

                {dropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-50 rounded-xl shadow-lg border ${isDark
                      ? "bg-neutral-800 border-neutral-700 text-white"
                      : "bg-white border-neutral-200 text-black"
                      }`}
                  >
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={goToProfile}
                    >
                      <FaUser /> Profile
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
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={() => {
                        setDropdown(false);
                        navigate("/subscription");
                      }}
                    >
                      <FaCrown  /> Try Q-KICS +
                    </button>

                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={() => {
                        setDropdown(false);
                        navigate("/my-bookings");
                      }}
                    >
                      <FaAddressBook   /> Bookings
                    </button>

                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={() => {
                        setDropdown(false);
                        navigate("/subscription");
                      }}
                    >
                      <IoChatboxEllipses  /> Chats
                    </button>

                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-neutral-700/20 rounded-xl"
                      onClick={() => {
                        setDropdown(false);
                        navigate("/notifications");
                      }}
                    >
                      <MdNotificationsActive  /> Notifications
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

      {/* MOBILE BOTTOM NAV */}
      <MobileBottomNav
        theme={theme}
        isLoggedIn={isLoggedIn}
        setShowLogin={setShowLogin}
      />
    </>
  );
}

export default Navbar;


