import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaHome, FaLightbulb, FaHandshake, FaBuilding } from "react-icons/fa";
import { FaUsersGear } from "react-icons/fa6";
import { useSelector } from "react-redux";

function MobileBottomNav({ theme, isLoggedIn, setShowLogin }) {
    const isDark = theme === "dark";
    const location = useLocation();
    const navigate = useNavigate();

    const getNavClass = (path) => {
        const isActive = location.pathname === path;
        const base = "flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-full relative h-full";

        if (isDark) {
            return isActive
                ? `${base} text-red-500`
                : `${base} text-neutral-500 hover:text-neutral-200`;
        } else {
            return isActive
                ? `${base} text-red-600`
                : `${base} text-neutral-400 hover:text-black`;
        }
    };

    const handleAuthNavigation = (path) => {
        if (!isLoggedIn) {
            setShowLogin(true);
        } else {
            navigate(path);
        }
    };

    return (
        <div
            className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]
        ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-black/5"}
`}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex justify-between items-center h-16 relative">

                {/* HOME */}
                <Link to="/" className="flex-1 h-full">
                    <div className={getNavClass("/")}>
                        <FaHome size={22} className={location.pathname === "/" ? "scale-110" : ""} />
                        <span className="text-[7px] font-black uppercase tracking-[0.05em]">Home</span>
                        {location.pathname === "/" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full" />
                        )}
                    </div>
                </Link>

                {/* EXPERTS */}
                <button
                    onClick={() => handleAuthNavigation("/experts")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/experts")}>
                        <FaUsersGear size={22} className={location.pathname === "/experts" ? "scale-110" : ""} />
                        <span className="text-[7px] font-black uppercase tracking-[0.05em]">Experts</span>
                        {location.pathname === "/experts" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full" />
                        )}
                    </div>
                </button>

                {/* CONNECT */}
                <button
                    onClick={() => handleAuthNavigation("/entrepreneur-connect")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/entrepreneur-connect")}>
                        <FaHandshake size={22} className={location.pathname === "/entrepreneur-connect" ? "scale-110" : ""} />
                        <span className="text-[7px] font-black uppercase tracking-[0.05em]">Connect</span>
                        {location.pathname === "/entrepreneur-connect" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full" />
                        )}
                    </div>
                </button>

                {/* KNOWLEDGE HUB */}
                <button
                    onClick={() => handleAuthNavigation("/knowledge-hub")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/knowledge-hub")}>
                        <FaLightbulb size={22} className={location.pathname === "/knowledge-hub" ? "scale-110" : ""} />
                        <span className="text-[7px] font-black uppercase tracking-[0.05em]">Hub</span>
                        {location.pathname === "/knowledge-hub" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full" />
                        )}
                    </div>
                </button>

                {/* COMPANY */}
                <button
                    onClick={() => handleAuthNavigation("/company")}
                    className="flex-1 h-full"
                >
                    <div className={getNavClass("/company")}>
                        <FaBuilding size={22} className={location.pathname === "/company" ? "scale-110" : ""} />
                        <span className="text-[7px] font-black uppercase tracking-[0.05em]">Company</span>
                        {location.pathname === "/company" && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-red-600 rounded-full" />
                        )}
                    </div>
                </button>

            </div>
        </div>
    );
}

export default MobileBottomNav;
