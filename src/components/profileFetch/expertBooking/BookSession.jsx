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

export default function BookSession() {
  const { expertUuid } = useParams();
  const navigate = useNavigate();

  const { theme } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [bookingType, setBookingType] = useState("CHAT"); // "CHAT" or "VIDEO_CALL"

  /* ---------------- FETCH SLOTS ---------------- */
  useEffect(() => {
    fetchSlots();
  }, [expertUuid]);

  const fetchSlots = async () => {
    try {
      setLoading(true);

      const res = await axiosSecure.get(
        `/v1/bookings/experts/${expertUuid}/slots/`
      );

      const availableSlots = (res.data || []).filter(
        (slot) => Boolean(slot.is_chat_available || slot.is_video_call_available)
      );

      setSlots(availableSlots);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-select booking type when slot changes
  useEffect(() => {
    if (!selectedSlot) return;

    if (Number(selectedSlot.chat_price) > 0 && selectedSlot.is_chat_available) {
      setBookingType("CHAT");
    } else if (Number(selectedSlot.video_call_price) > 0 && selectedSlot.is_video_call_available) {
      setBookingType("VIDEO_CALL");
    }
  }, [selectedSlot]);

  /* ---------------- FAKE PAYMENT FLOW ---------------- */
  const handleProceedToPay = () => {
    if (!selectedSlot || paymentProcessing) return;

    const currentPrice = bookingType === "CHAT" ? selectedSlot.chat_price : selectedSlot.video_call_price;

    showConfirm({
      title: "Confirm Payment",
      message: `You will be charged ₹${currentPrice} for this ${bookingType === "CHAT" ? "Chat" : "Video Call"} session. Continue?`,
      confirmText: "Pay Now",
      cancelText: "Cancel",

      onConfirm: async () => {
        setPaymentProcessing(true);

        try {
          /* 1️⃣ CREATE BOOKING */
          const booking = await dispatch(
            createBooking({ slotUuid: selectedSlot.uuid, bookingType })
          ).unwrap();

          console.log("✅ Booking created:", booking);

          /* 2️⃣ FAKE PAYMENT API */
          const paymentRes = await axiosSecure.post(
            "/v1/payments/fake/booking/",
            {
              booking_id: booking.uuid,
            }
          );

          console.log("✅ Fake payment success:", paymentRes.data);

          setPaymentProcessing(false);

          showAlert(
            "Payment successful! Booking confirmed.",
            "success"
          );

          // Remove booked slot
          setSlots((prev) =>
            prev.filter((s) => s.uuid !== selectedSlot.uuid)
          );
          setSelectedSlot(null);
          dispatch(resetBookingState());

          // Optional chat navigation
          if (paymentRes.data.chat_room_id) {
            console.log(
              "💬 Chat room created:",
              paymentRes.data.chat_room_id
            );
            // navigate(`/chat/${paymentRes.data.chat_room_id}`);
          }
        } catch (err) {
          console.error("❌ Payment failed:", err);
          setPaymentProcessing(false);

          showAlert(
            "Payment failed. Please try again.",
            "error"
          );
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
                <p className="text-sm font-medium text-center opacity-70">This expert currently has no available time slots.</p>
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
                  <div className="grid sm:grid-cols-2 gap-4">
                    {daySlots.map(slot => {
                      const isSelected = selectedSlot?.uuid === slot.uuid;
                      const { time: startTime } = formatDateTime(slot.start_datetime);
                      const { time: endTime } = formatDateTime(slot.end_datetime);

                      return (
                        <div
                          key={slot.uuid}
                          onClick={() => setSelectedSlot(slot)}
                          className={`relative p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer overflow-hidden group hover:-translate-y-1 ${isSelected
                            ? "border-red-600 bg-red-600/5 shadow-2xl shadow-red-600/20"
                            : isDark ? "border-white/5 bg-white/5 hover:border-white/10" : "border-black/5 bg-white hover:border-black/10 shadow-sm"
                            }`}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 text-red-600 animate-fadeIn">
                              <FiCheckCircle size={22} className="fill-current text-white dark:text-[#0a0a0a]" />
                            </div>
                          )}
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

                            <div className={`mt-2 pt-4 border-t w-full transition-colors ${isSelected ? "border-red-600/20" : isDark ? "border-white/10" : "border-black/10"}`}>
                              <div className="flex flex-col gap-1.5">
                                {Number(slot.chat_price) > 0 && (
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Chat Price</span>
                                    <span className={`text-base font-black ${isSelected ? "text-red-600" : ""}`}>₹{slot.chat_price}</span>
                                  </div>
                                )}
                                {Number(slot.video_call_price) > 0 && (
                                  <div className="flex justify-between items-center w-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Video Call Price</span>
                                    <span className={`text-base font-black ${isSelected ? "text-red-600" : ""}`}>₹{slot.video_call_price}</span>
                                  </div>
                                )}
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

        {/* RIGHT – PAYMENT SUMMARY */}
        <div className="w-full lg:w-[400px]">
          <div className={`sticky top-28 p-8 md:p-10 rounded-[2.5rem] transition-all ${isDark ? "bg-neutral-900 shadow-xl shadow-black/50 border border-white/5" : "bg-white shadow-2xl shadow-black/5 border border-black/5"
            }`}>
            <h2 className="text-xl font-black  tracking-tight mb-8">
              Booking <span className="text-red-600">Summary</span>
            </h2>

            {!selectedSlot ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <FiCheckCircle size={48} className="mb-6 opacity-50" />
                <p className="text-[10px] text-center font-black uppercase tracking-widest leading-loose">
                  Select a slot from<br />the calendar to continue
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">

                <div className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-neutral-50"}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3">Consultation Type</p>
                  <div className="flex gap-2 mb-5">
                    {Number(selectedSlot.chat_price) > 0 && (
                      <button
                        onClick={() => setBookingType("CHAT")}
                        disabled={!selectedSlot.is_chat_available}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!selectedSlot.is_chat_available ? "opacity-30 cursor-not-allowed grayscale" : ""} ${bookingType === "CHAT"
                          ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                          : "border-neutral-500/20 text-neutral-500 hover:border-neutral-500/40"
                          }`}
                      >
                        {selectedSlot.is_chat_available ? "Chat" : "Chat (Booked)"}
                      </button>
                    )}
                    {Number(selectedSlot.video_call_price) > 0 && (
                      <button
                        onClick={() => setBookingType("VIDEO_CALL")}
                        disabled={!selectedSlot.is_video_call_available}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!selectedSlot.is_video_call_available ? "opacity-30 cursor-not-allowed grayscale" : ""} ${bookingType === "VIDEO_CALL"
                          ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20"
                          : "border-neutral-500/20 text-neutral-500 hover:border-neutral-500/40"
                          }`}
                      >
                        {selectedSlot.is_video_call_available ? "Video" : "Video (Booked)"}
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Selected Time</p>
                  <p className="font-bold text-lg leading-snug">
                    {formatDateTime(selectedSlot.start_datetime).date}
                  </p>
                  <p className="text-sm font-medium opacity-80 mt-1">
                    {formatDateTime(selectedSlot.start_datetime).time} — {formatDateTime(selectedSlot.end_datetime).time}
                  </p>
                </div>

                <div className="space-y-4 px-2">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="opacity-60">Duration</span>
                    <span className="font-bold text-red-600">{selectedSlot.duration_minutes} Minutes</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="opacity-60">Session Fee</span>
                    <span className="font-bold">₹{bookingType === "CHAT" ? selectedSlot.chat_price : selectedSlot.video_call_price}</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-dashed border-neutral-500/30 px-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Total</span>
                    <span className="text-4xl font-black text-red-600 tracking-tighter">
                      ₹{bookingType === "CHAT" ? selectedSlot.chat_price : selectedSlot.video_call_price}
                    </span>
                  </div>
                </div>

                <div className="pt-2 px-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mt-1 w-4 h-4 accent-red-600 rounded bg-transparent border-white/20"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-loose opacity-60 group-hover:opacity-100 transition-opacity">
                      I agree to the <span className="text-red-600 hover:underline">terms and conditions</span> and acknowledge the cancellation policy
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleProceedToPay}
                  disabled={paymentProcessing || !agreed}
                  className={`mt-4 w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${(paymentProcessing || !agreed)
                    ? "bg-neutral-600 text-white/50 cursor-not-allowed shadow-none"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-1"
                    }`}
                >
                  {paymentProcessing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing
                    </span>
                  ) : "Confirm & Pay"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
