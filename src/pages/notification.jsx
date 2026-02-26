import { useSelector } from "react-redux";
import { FaBell, FaSync, FaCheckCircle, FaInbox } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationPage() {
  const { theme } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    refreshing,
    fetchNotifications,
    markAsRead,
  } = useNotifications();

  const handleMarkAsRead = (id, isAlreadyRead) => {
    markAsRead(id, isAlreadyRead);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-fadeIn">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
            <FaBell className="text-red-600" /> Notifications
          </h1>
          <p className="opacity-60 font-medium">
            Stay updated with your latest alerts and messages.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-xl flex gap-4 font-bold shadow-sm ${isDark ? "bg-white/5" : "bg-black/5"}`}>
            <span className="text-red-500">
              {unreadCount > 9 ? "9+" : unreadCount} <span className="text-xs uppercase opacity-70">Unread</span>
            </span>
            <span className="opacity-50">|</span>
            <span>
              {totalCount} <span className="text-xs uppercase opacity-70">Total</span>
            </span>
          </div>

          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing || loading}
            className={`p-3 rounded-xl transition-all shadow-sm ${isDark
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-black/5 hover:bg-black/10 text-black"
              }`}
            title="Refresh"
          >
            <FaSync className={`${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="w-full h-px mb-8 bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="animate-fadeIn">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-red-600 border-black/10 dark:border-white/10"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`p-16 rounded-3xl text-center flex flex-col items-center justify-center border ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-100 shadow-sm"}`}>
            <div className={`p-6 rounded-full mb-4 ${isDark ? "bg-white/5 text-neutral-600" : "bg-gray-50 text-gray-300"}`}>
              <FaInbox className="text-6xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
            <p className="opacity-50 font-medium max-w-sm">
              There are no new notifications to display right now. Check back later.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {notifications.map((notif) => {
              // FIX: API returns _id, readAt may not exist (unread notifications)
              const isRead = !!notif.readAt;
              return (
                <div
                  key={notif._id}
                  onClick={() => handleMarkAsRead(notif._id, isRead)}
                  className={`group relative p-5 rounded-2xl transition-all duration-300 cursor-pointer border shadow-sm ${isRead
                    ? isDark
                      ? "bg-transparent border-neutral-800 opacity-70"
                      : "bg-transparent border-gray-200"
                    : isDark
                      ? "bg-neutral-900 border-red-500/30 hover:border-red-500"
                      : "bg-white border-red-200 hover:border-red-400"
                    }`}
                >
                  <div className="flex gap-4">
                    {/* Unread indicator dot */}
                    <div className="mt-1 flex-shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full transition-all ${isRead ? "bg-transparent border border-gray-400" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                          }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        {/* FIX: API returns renderedSubject, not subject */}
                        <h4 className={`text-lg font-bold leading-tight ${!isRead ? "text-red-500" : ""}`}>
                          {notif.renderedSubject}
                        </h4>
                        <span className="text-xs font-bold opacity-40 uppercase tracking-widest whitespace-nowrap">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      {/* FIX: API returns renderedBody, not body */}
                      <p className={`text-sm leading-relaxed mb-3 ${isDark ? (isRead ? "text-gray-400" : "text-gray-300") : (isRead ? "text-gray-500" : "text-gray-700")}`}>
                        {notif.renderedBody}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                          {notif.event.replace(/_/g, " ")}
                        </span>

                        {isRead && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                            <FaCheckCircle /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}