import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdOutlineSchedule, MdPerson, MdOutlinePayments, MdChatBubbleOutline, MdOutlineTimer, MdVideocam } from "react-icons/md";

import axiosSecure from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";

export default function MyBookings() {
  const { theme, data: user } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("expert");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const text = isDark ? "text-white" : "text-black";

  /* ---------------- FETCH BOOKINGS ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      let combinedData = [];

      if (activeTab === "expert") {
        if (user.user_type === "expert") {
          const [resExp, resCli] = await Promise.all([
            axiosSecure.get("/v1/bookings/?as_expert=true"),
            axiosSecure.get("/v1/bookings/")
          ]);
          const conducting = (Array.isArray(resExp.data) ? resExp.data : (resExp.data?.results || [])).map(b => ({ ...b, _role: "conducting" }));
          const attending = (Array.isArray(resCli.data) ? resCli.data : (resCli.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
          combinedData = [...conducting, ...attending];
        } else {
          const res = await axiosSecure.get("/v1/bookings/");
          combinedData = (Array.isArray(res.data) ? res.data : (res.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
        }
      } else {
        if (user.user_type === "investor") {
          const [resInv, resCli] = await Promise.all([
            axiosSecure.get("/v1/bookings/investor-bookings/list/?as_investor=true"),
            axiosSecure.get("/v1/bookings/investor-bookings/list/")
          ]);
          const conducting = (Array.isArray(resInv.data) ? resInv.data : (resInv.data?.results || [])).map(b => ({ ...b, _role: "conducting" }));
          const attending = (Array.isArray(resCli.data) ? resCli.data : (resCli.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
          combinedData = [...conducting, ...attending];
        } else {
          const res = await axiosSecure.get("/v1/bookings/investor-bookings/list/");
          combinedData = (Array.isArray(res.data) ? res.data : (res.data?.results || [])).map(b => ({ ...b, _role: "attending" }));
        }
      }

      // Deduplicate by UUID
      const uniqueMap = new Map();
      combinedData.forEach(item => {
        if (!uniqueMap.has(item.uuid)) {
          uniqueMap.set(item.uuid, item);
        }
      });

      const sorted = Array.from(uniqueMap.values()).sort((a, b) => new Date(b.start_datetime) - new Date(a.start_datetime));
      setBookings(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
      showAlert("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS CONFIG ---------------- */
  const getStatusConfig = (booking) => {
    const status = (booking.cancelled_at ? "CANCELLED" :
      booking.declined_at ? "DECLINED" :
        booking.completed_at ? "COMPLETED" :
          booking.confirmed_at ? "CONFIRMED" :
            booking.paid_at ? "PAID" : booking.status).toUpperCase();

    switch (status) {
      case "CONFIRMED":
      case "COMPLETED":
        return { label: status, color: "bg-green-500/10 border-green-500/20 text-green-500" };
      case "PAID":
        return { label: status, color: "bg-blue-500/10 border-blue-500/20 text-blue-500" };
      case "PENDING":
        return { label: status, color: "bg-amber-500/10 border-amber-500/20 text-amber-500" };
      case "CANCELLED":
      case "DECLINED":
        return { label: status, color: "bg-red-500/10 border-red-500/20 text-red-500" };
      default:
        return { label: status, color: "bg-neutral-500/10 border-neutral-500/20 text-neutral-500" };
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${text}`}>Syncing Calendar...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="premium-card p-12 text-center max-w-sm glass border-red-500/20">
          <p className="text-red-500 font-black text-sm uppercase tracking-widest mb-6">{error}</p>
          <button onClick={fetchBookings} className="px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-red-600/30 hover:scale-105 transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-4  md:px-8 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 animate-fadeIn">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              My <span className="text-red-600">Sessions</span>
            </h1>
            <p className="opacity-50 font-medium leading-relaxed">
              Strategic scheduling for high-impact professional collaborations. Track and manage your expert intelligence exchange.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass rounded-2xl shadow-xl">
              <span className="h-2 w-2 bg-red-600 rounded-full animate-pulse shadow-sm shadow-red-600/50"></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${text}`}>{bookings.length} Registered Sessions</span>
            </div>
          </div>
        </div>

        {/* TABS FOR EXPERT / INVESTOR */}
        <div className="flex border-b border-black/10 dark:border-white/10 mb-8 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("expert")}
            className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "expert" ? "border-b-2 border-red-600 text-red-600" : "text-neutral-500 hover:text-black dark:hover:text-white"}`}
          >
            Expert Sessions
          </button>
          <button
            onClick={() => setActiveTab("investor")}
            className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === "investor" ? "border-b-2 border-red-600 text-red-600" : "text-neutral-500 hover:text-black dark:hover:text-white"}`}
          >
            Investor Pitch Sessions
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="premium-card py-32 text-center glass border-dashed animate-fadeIn">
            <div className="h-20 w-20 bg-black/5 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <MdOutlineSchedule className="text-3xl opacity-20" />
            </div>
            <h3 className={`text-xl font-black tracking-tight mb-2 ${text}`}>No activity detected</h3>
            <p className="opacity-30 text-[10px] font-bold uppercase tracking-[0.3em]">Your trajectory is clear. Initiate a booking to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {bookings.map((booking) => {
              const status = getStatusConfig(booking);
              const startDate = new Date(booking.start_datetime);
              const endDate = new Date(booking.end_datetime);
              const durationMins = booking.duration_minutes || Math.floor((endDate - startDate) / 60000);

              let otherPersonName = "";
              if (activeTab === "expert") {
                otherPersonName = booking._role === "conducting" ? booking.user_name : booking.expert_name;
              } else {
                otherPersonName = booking._role === "conducting" ? booking.user_name : booking.investor_name;
              }

              return (
                <div
                  key={booking.uuid}
                  className={`group relative p-8 premium-card transition-all duration-500 hover:shadow-2xl animate-fadeIn ${isDark ? "bg-neutral-900" : "bg-white"}`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                        <MdPerson size={28} />
                      </div>
                      <div>
                        <h4 className={`font-black text-lg tracking-tight mb-2 group-hover:text-red-500 transition-colors ${text}`}>
                          {otherPersonName}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest border shadow-sm transition-all duration-500 ${status.color}`}>
                            {status.label}
                          </span>

                          {booking._role === "attending" && (
                            <span className={`inline-block px-3 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest border border-red-500/20 bg-red-500/5 text-red-500`}>
                              My Booking
                            </span>
                          )}
                          {booking._role === "conducting" && (
                            <span className={`inline-block px-3 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest border border-purple-500/20 bg-purple-500/5 text-purple-500`}>
                              My Session
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 group-hover:bg-red-500/5 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-red-500">
                          <MdOutlineSchedule size={20} />
                        </div>
                        <div className="flex-1 flex items-start justify-between gap-4">
                          <div>
                            <p className={`text-sm font-black mb-1 ${text}`}>{startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            <p className="text-[11px] font-bold opacity-40 uppercase tracking-tighter">
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' — '}
                              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${isDark ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-black/40"}`}>
                            {booking.session_type === "VIDEO_CALL" ? (
                              <>
                                <MdVideocam size={12} className="text-red-500" /> Video
                              </>
                            ) : (
                              <>
                                <MdChatBubbleOutline size={12} className="text-red-500" /> Chat
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Duration</p>
                        <div className="flex items-center gap-2">
                          <MdOutlineTimer className="text-red-500" size={16} />
                          <span className={`text-[11px] font-black ${text}`}>{durationMins}m</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Fee</p>
                        <div className="flex items-center justify-end gap-2">
                          <MdOutlinePayments className="text-red-500" size={16} />
                          <span className={`text-[11px] font-black ${text}`}>{booking.price !== undefined ? `₹${booking.price}` : "Free"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(booking.chat_room_id || booking.call_room_id || ['CONFIRMED', 'PAID', 'COMPLETED'].includes(status.label)) && (
                    now >= startDate ? (
                      <div className="flex flex-col gap-3">
                        {booking.session_type === "VIDEO_CALL" ? (
                          <button
                            onClick={() => booking.call_room_id ? navigate(`/video-call/${booking.call_room_id}`) : showAlert("Video room not ready yet", "info")}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
                          >
                            <MdVideocam size={20} />
                            Start Video Call
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(booking.chat_room_id ? `/chat/${booking.chat_room_id}` : '/chat')}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
                          >
                            <MdChatBubbleOutline size={20} />
                            {booking.session_type === "CHAT" ? "Start Chat" : "Open Communication"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-neutral-300 dark:bg-neutral-800 text-neutral-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-none cursor-not-allowed transition-all"
                      >
                        <MdChatBubbleOutline size={20} />
                        Starts @ {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
