import { NavLink } from "react-router-dom";
import {
  FaThLarge,
  FaTags,
  FaUsers,
  FaFileAlt,
  FaCreditCard,
  FaTerminal,
} from "react-icons/fa";
import { MdFeed } from "react-icons/md";

export default function AdminSidebar({ role, isOpen, theme }) {
  const isDark = theme === "dark";

  return (
    <aside
      className={`
        relative h-screen flex flex-col transition-all duration-300 ease-in-out
        border-r shadow-sm overflow-hidden z-20
        ${isOpen ? "w-64" : "w-20"}
        ${isDark
          ? "bg-neutral-900 border-neutral-800 text-neutral-100"
          : "bg-white border-neutral-200 text-neutral-900"}
      `}
    >
      {/* BRAND SECTION */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b h-16 ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
        <img src="/logo.png" className="h-8 w-8 min-w-[2rem] rounded shadow-sm" alt="logo" />
        {isOpen && (
          <span className={`text-lg font-bold tracking-tight truncate ${isDark ? "text-white" : ""}`}>
            QKICS Admin
          </span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${!isOpen && "text-center"} ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
          {isOpen ? "Main Menu" : "•••"}
        </div>

        <SidebarLink to="/admin" label="Dashboard" icon={<FaThLarge />} isOpen={isOpen} theme={theme} />
        <SidebarLink to="/admin-tags" label="Tags" icon={<FaTags />} isOpen={isOpen} theme={theme} />
        <SidebarLink to="/admin-users" label="Users" icon={<FaUsers />} isOpen={isOpen} theme={theme} />
        <SidebarLink to="/admin-posts" label="Posts" icon={<MdFeed />} isOpen={isOpen} theme={theme} />
        <SidebarLink to="/subscriptions" label="Subscriptions" icon={<FaCreditCard />} isOpen={isOpen} theme={theme} />
        <SidebarLink to="/admin-documents" label="Documents" icon={<FaFileAlt />} isOpen={isOpen} theme={theme} />

        {role === "superadmin" && (
          <div className={`pt-4 mt-4 border-t ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
            <div className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${!isOpen && "text-center"} ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
              {isOpen ? "System" : "•••"}
            </div>
            <SidebarLink to="/system-logs" label="Logs" icon={<FaTerminal />} isOpen={isOpen} theme={theme} />
          </div>
        )}
      </nav>

      {/* FOOTER SECTION (Optional: User info or logout) */}
      <div className={`p-4 border-t ${isDark ? "border-neutral-800" : "border-neutral-100"}`}>
        <div className={`flex items-center transition-all ${isOpen ? "gap-3" : "justify-center"}`}>
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            {role?.[0].toUpperCase()}
          </div>
          {isOpen && (
            <div className="truncate">
              <p className={`text-sm font-medium truncate ${isDark ? "text-white" : ""}`}>{role}</p>
              <p className="text-xs text-neutral-500 truncate">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon, isOpen, theme }) {
  const isDark = theme === "dark";
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
        ${isActive
          ? isDark
            ? "bg-blue-500/10 text-blue-400 font-medium"
            : "bg-blue-50 text-blue-600 font-medium"
          : isDark
            ? "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
        }
        ${!isOpen ? "justify-center" : ""}
        `
      }
      title={!isOpen ? label : ""}
    >
      {({ isActive }) => (
        <>
          <span className={`text-xl transition-colors ${!isOpen ? "mx-auto" : ""}`}>
            {icon}
          </span>
          {isOpen && <span className="truncate">{label}</span>}

          {isActive && isOpen && (
            <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDark ? "bg-blue-400" : "bg-blue-600"}`} />
          )}
        </>
      )}
    </NavLink>
  );
}
