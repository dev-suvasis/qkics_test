
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaBell, FaFileAlt, FaHandshake } from "react-icons/fa";
import { FaUsersGear } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { useNotifications } from "../../context/NotificationContext";

function MobileBottomNav({ theme, isLoggedIn, setShowLogin, onAction }) {
    const isDark = theme === "dark";
    const location = useLocation();
    const navigate = useNavigate();
    const { data: user } = useSelector((state) => state.user);
    const { unreadCount } = useNotifications();

    const getNavClass = (path) => {
        const isActive = location.pathname === path;
        const base = "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-full relative h-full";

        if (isDark) {
            return isActive
                ? `${base} text - red - 500`
                : `${base} text - neutral - 500 hover: text - neutral - 200`;
        } else {
            return isActive
                ? `${base} text - red - 600`
                : `${base} text - neutral - 400 hover: text - black`;
        }
    };

    const handleAuthNavigation = (path) => {
        if (!isLoggedIn) {
            setShowLogin(true);
        } else {
            navigate(path);
        }
    };

    const handleCreatePost = () => {
        if (!isLoggedIn) {
            setShowLogin(true);
        } else {
            onAction?.();
        }
    };

    return (
        <div
            className={`md:hidden fixed bottom - 0 left - 0 right - 0 z - 50 border - t backdrop - blur - 3xl supports - [backdrop - filter]: bg - opacity - 95 shadow - [0_ - 10px_40px_ - 15px_rgba(0, 0, 0, 0.3)]
        ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-black/5"}
`}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex justify-between items-center h-20 px-4 relative">

                {/* HOME */}
                <Link to="/" className="flex-1 h-full">
                    <div className={getNavClass("/")}>
                        <FaHome size={22} className={location.pathname === "/" ? "scale-110" : ""} />
                        <span className="text-[8px] font-black uppercase tracking-[0.1em]">Home</span>
                        {location.pathname === "/" && (
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600" />
                        )}
                    </div>
                </Link>

                {/* NETWORK / PROFESSIONALS */}
                <button
                    onClick={() => handleAuthNavigation("/booking")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/booking")}>
                        <FaUsersGear size={22} className={location.pathname === "/booking" ? "scale-110" : ""} />
                        <span className="text-[8px] font-black uppercase tracking-[0.1em]">Network</span>
                        {location.pathname === "/booking" && (
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600" />
                        )}
                    </div>
                </button>

                {/* ENTREPRENEUR CONNECT */}
                <button
                    onClick={() => handleAuthNavigation("/entrepreneur-connect")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/entrepreneur-connect")}>
                        <FaHandshake size={22} className={location.pathname === "/entrepreneur-connect" ? "scale-110" : ""} />
                        <span className="text-[8px] font-black uppercase tracking-[0.1em]">Connect</span>
                        {location.pathname === "/entrepreneur-connect" && (
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600" />
                        )}
                    </div>
                </button>

                {/* CREATE POST (Center FAB Style) */}
                <div className="flex-1 flex justify-center h-full relative -translate-y-5">
                    <button
                        onClick={handleCreatePost}
                        className="h-16 w-16 rounded-[1.5rem] bg-red-600 text-white shadow-2xl shadow-red-600/50 flex items-center justify-center hover:bg-red-700 active:scale-90 transition-all border-[6px] border-[#f8f9fa] dark:border-[#0a0a0a]"
                    >
                        <FaPlus size={22} className="transform group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    <span className="absolute -bottom-1 text-[8px] font-black text-red-600 uppercase tracking-[0.1em] translate-y-5">Create</span>
                </div>

                {/* NOTIFICATIONS */}
                {isLoggedIn && (
                    <button
                        onClick={() => navigate("/notifications")}
                        className="flex-1 h-full relative"
                    >
                        <div className={getNavClass("/notifications")}>
                            <div className="relative">
                                <FaBell size={22} className={location.pathname === "/notifications" ? "scale-110" : ""} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-md">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.1em]">Alerts</span>
                            {location.pathname === "/notifications" && (
                                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600" />
                            )}
                        </div>
                    </button>
                )}

                {/* DOCUMENTS */}
                <button
                    onClick={() => handleAuthNavigation("/document")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/document")}>
                        <FaFileAlt size={22} className={location.pathname === "/document" ? "scale-110" : ""} />
                        <span className="text-[8px] font-black uppercase tracking-[0.1em]">Docs</span>
                        {location.pathname === "/document" && (
                            <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600" />
                        )}
                    </div>
                </button>

            </div>
        </div>
    );
}

export default MobileBottomNav;
