import { NavLink } from "react-router-dom";

export default function AdminSidebar({ role }) {
  return (
    <aside
      className="
        w-64 h-full p-5 ml-4 mt-4 rounded-xl shadow-md border
         backdrop-blur-md dark:bg-neutral-900/60
        border-neutral-200 dark:border-neutral-700
      "
    >
      <nav className="flex flex-col gap-2">

        <div className="text-sm font-semibold pb-4 border-b border-neutral-300  dark:text-neutral-400 uppercase mb-2 tracking-wide">
          Navigation
        </div>

        <SidebarLink to="/admin" label="Dashboard" />
        <SidebarLink to="/adminTags" label="Tags" />
        <SidebarLink to="/adminUsers" label="Users" />
        <SidebarLink to="/adminPosts" label="Posts" />
        <SidebarLink to="/subscriptions" label="Subscriptions" />

        {role === "superadmin" && (
          <>
            <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase mt-4 tracking-wide">
              Superadmin
            </div>

            <SidebarLink to="/system-logs" label="System Logs" />
          </>
        )}
      </nav>
    </aside>
  );
}

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        relative block px-4 py-2 rounded-lg transition-all
        ${
          isActive
            ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500"
            : " hover:bg-neutral-200/50 dark:hover:bg-neutral-700/40"
        }
        `
      }
    >
      {label}
    </NavLink>
  );
}
