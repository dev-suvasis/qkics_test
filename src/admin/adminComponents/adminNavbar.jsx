import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faBars } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar({ theme, role, onToggleTheme, toggleSidebar, isSidebarOpen }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  return (
    <header
      className={`
        sticky top-0 z-10
        h-16 px-6 flex items-center justify-between
        border-b backdrop-blur-md transition-all duration-300
        ${isDark
          ? "bg-neutral-900/80 border-neutral-800 text-white"
          : "bg-white/80 border-neutral-200 text-neutral-900"
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* SIDEBAR TOGGLE */}
        <button
          onClick={toggleSidebar}
          className={`
            p-2 rounded-lg transition-colors
            ${isDark
              ? "hover:bg-neutral-800 text-neutral-400"
              : "hover:bg-neutral-100 text-neutral-500"
            }
          `}
        >
          <FaBars className={`text-xl transition-transform ${isSidebarOpen ? "rotate-90" : ""}`} />
        </button>

        {/* BREADCRUMB OR TITILE - Optional but good for ERP */}
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold capitalize">
            {window.location.pathname.split("/").pop() || "Dashboard"}
          </h1>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-4">

        {/* THEME TOGGLE BUTTON */}
        <button
          onClick={onToggleTheme}
          className={`
            h-9 w-9 rounded-full border flex items-center justify-center
            transition-all
            ${isDark
              ? "border-neutral-600 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100"
            }
          `}
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
        </button>

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => navigate("/logout")}
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg border transition
            border-red-400 bg-red-400/10 text-red-600
            hover:bg-red-400/20 dark:border-red-500 dark:bg-red-500/20 dark:text-red-300
          "
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </header>
  );
}
