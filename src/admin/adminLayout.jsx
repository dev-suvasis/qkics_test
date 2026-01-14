import { useState } from "react";
import AdminNavbar from "./adminComponents/AdminNavbar";
import AdminSidebar from "./adminComponents/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout({ theme, role, onToggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isDark = theme === "dark";

  return (
    <div className={isDark ? "dark" : ""}>
      <div className={`h-screen flex overflow-hidden ${isDark ? "bg-neutral-950" : "bg-white"}`}>
        {/* LEFT SIDEBAR - Fixed height, spans full height */}
        <AdminSidebar role={role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} theme={theme} />

        {/* RIGHT SIDE AREA - Navbar + Main Content */}
        <div className={`
          flex flex-col flex-1 min-w-0 transition-all duration-300
          ${isDark ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"}
        `}>

          {/* TOP NAVBAR - Sticky, full width of the right area */}
          <AdminNavbar
            theme={theme}
            role={role}
            onToggleTheme={onToggleTheme}
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
