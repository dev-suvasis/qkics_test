import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

import axiosSecure from "../../utils/axiosSecure";

import { useDispatch, useSelector } from "react-redux";
import {
  createBooking,
  resetBookingState,
} from "../../../redux/slices/bookingSlice";

import { useAlert } from "../../../context/AlertContext";
import { useConfirm } from "../../../context/ConfirmContext";
import { FiArrowLeft, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi";

export default function InvestorBookSession() {
  const { investorUuid } = useParams();
  const navigate = useNavigate();

  const { theme } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  /* ---------------- FETCH SLOTS ---------------- */
  useEffect(() => {
    fetchSlots();
  }, [investorUuid]);

  const fetchSlots = async () => {
    try {
      setLoading(true);

      const res = await axiosSecure.get(
        `/v1/bookings/investors/${investorUuid}/slots/`
      );

      const responseData = res.data;
      const slotsData = Array.isArray(responseData) ? responseData : (responseData?.results || []);

      const availableSlots = slotsData.filter(
        (slot) => Boolean(slot.is_available)
      );

      setSlots(availableSlots);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- BOOKING FLOW ---------------- */
  const handleSlotClick = (slot) => {
    if (paymentProcessing) return;

    showConfirm({
      title: "Confirm Booking",
      message: `Do you want to book this session with this Investor?`,
      confirmText: "Book Now",
      cancelText: "Cancel",

      onConfirm: async () => {
        setPaymentProcessing(true);

        try {
          /* 1️⃣ CHECK SUBSCRIPTION STATUS */
          let subscription;
          try {
            const subRes = await axiosSecure.get("/v1/subscriptions/me/");
            subscription = subRes.data;
          } catch (err) {
            // Probably 404 or specific "No active subscription" error
            throw new Error("UNSUBSCRIBED");
          }

          // Validation: Check if subscription is active and within date range
          const now = new Date();
          const startDate = new Date(subscription.start_date);
          const endDate = new Date(subscription.end_date);

          if (!subscription.is_active || now < startDate || now > endDate) {
            throw new Error("UNSUBSCRIBED");
          }

          /* 2️⃣ CREATE BOOKING */
          const bookingRes = await axiosSecure.post("/v1/bookings/investor-bookings/", {
            slot_id: slot.uuid,
          });

          console.log("✅ Booking successful:", bookingRes.data);

          showAlert(
            "Booking confirmed successfully!",
            "success"
          );

          // Remove booked slot from UI
          setSlots((prev) =>
            prev.filter((s) => s.uuid !== slot.uuid)
          );

          dispatch(resetBookingState());
          setPaymentProcessing(false);

        } catch (err) {
          console.error("❌ Booking failed:", err);
          setPaymentProcessing(false);

          if (err.message === "UNSUBSCRIBED" || err.response?.data?.detail === "No active subscription") {
            showAlert("This feature is available only for subscribed users. Please subscribe to a plan to continue.", "warning");
          } else {
            showAlert(
              "Booking failed. Please check your connection or try again.",
              "error"
            );
          }
        }
      },
    });
  };

  /* ---------------- HELPERS ---------------- */
  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const groupedSlots = useMemo(() => {
    const groups = {};
    slots.forEach(slot => {
      const { date } = formatDateTime(slot.start_datetime);
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
    });
    return groups;
  }, [slots]);

  /* ---------------- STATES UI ---------------- */
  if (loading) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center transition-colors ${isDark ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-black"}`}>
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black uppercase tracking-widest opacity-50">Loading Slots...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[80vh] flex items-center justify-center transition-colors ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="p-8 text-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
          <p className="font-bold">{error}</p>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className={`min-h-[90vh] transition-colors duration-300 ${isDark ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-neutral-900"}`}>
      {/* Top Banner Area (adds premium feel) */}
      <div className={`h-40 w-full absolute top-0 left-0 z-0 bg-linear-to-b ${isDark ? "from-red-900/10 to-transparent" : "from-red-500/5 to-transparent"}`} />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 px-4 md:px-8 relative z-10 pt-8">

        {/* LEFT – SLOT LIST */}
        <div className="flex-1 w-full pt-4">
          {/* HEADER */}
          <div className="flex items-start gap-4 mb-10">
            <button
              onClick={() => navigate(-1)}
              className={`p-3 rounded-full mt-1 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"}`}
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Select <span className="text-red-600">Session</span>
              </h1>
              <p className={`text-sm font-medium mt-2 opacity-60`}>
                Choose a suitable time slot for your consultation session.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {Object.keys(groupedSlots).length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-24 rounded-[2rem] border-2 border-dashed ${isDark ? "border-white/5 text-neutral-500 bg-black/20" : "border-black/5 text-neutral-400 bg-white"}`}>
                <FiCalendar size={56} className="mb-6 opacity-30" />
                <p className="font-black text-xl uppercase tracking-widest mb-2 text-center text-red-600">No Slots Available</p>
                <p className="text-sm font-medium text-center opacity-70">This investor currently has no available time slots.</p>
              </div>
            ) : (
              Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
                <div key={dateLabel} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-red-600" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-80">
                      {dateLabel}
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySlots.map(slot => {
                      const { time: startTime } = formatDateTime(slot.start_datetime);
                      const { time: endTime } = formatDateTime(slot.end_datetime);

                      return (
                        <div
                          key={slot.uuid}
                          onClick={() => handleSlotClick(slot)}
                          className={`relative p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer overflow-hidden group hover:-translate-y-1 ${isDark ? "border-white/5 bg-white/5 hover:border-white/10 hover:shadow-xl hover:shadow-black/50" : "border-black/5 bg-white hover:border-black/10 shadow-sm hover:shadow-xl"
                            }`}
                        >
                          <div className="flex flex-col items-start gap-4">
                            <div className="font-bold text-2xl tracking-tight">
                              {startTime}
                            </div>

                            <div className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-60`}>
                              <div className="flex items-center gap-1.5 bg-neutral-500/10 px-2.5 py-1 rounded-full text-red-600 dark:text-red-400">
                                <FiClock size={12} />
                                {slot.duration_minutes} MIN
                              </div>
                              <div className="flex items-center gap-1.5 opacity-60">
                                TO {endTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
