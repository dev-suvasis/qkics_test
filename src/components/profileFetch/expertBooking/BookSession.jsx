import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import axiosSecure from "../../utils/axiosSecure";

import { useDispatch } from "react-redux";
import {
  createBooking,
  resetBookingState,
} from "../../../redux/slices/bookingSlice";

import { useAlert } from "../../../context/AlertContext";
import { useConfirm } from "../../../context/ConfirmContext";
import useThemeClasses from "../../utils/useThemeClasses";

export default function BookSession({ theme }) {
  const { expertUuid } = useParams();
  const navigate = useNavigate();

  const isDark = theme === "dark";
  const { border1, card } = useThemeClasses(isDark);

  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
        (slot) => slot.is_available === true
      );

      setSlots(availableSlots);
    } catch (err) {
      console.error(err);
      setError("Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SELECT SLOT ---------------- */
  const selectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  /* ---------------- FAKE PAYMENT FLOW ---------------- */
  const handleProceedToPay = () => {
    if (!selectedSlot || paymentProcessing) return;

    showConfirm({
      title: "Confirm Payment",
      message: `You will be charged ₹${selectedSlot.price} for this session. Continue?`,
      confirmText: "Pay Now",
      cancelText: "Cancel",

      onConfirm: async () => {
        setPaymentProcessing(true);

        try {
          /* 1️⃣ CREATE BOOKING */
          const booking = await dispatch(
            createBooking(selectedSlot.uuid)
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

  /* ---------------- STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading slots...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen pt-20 max-w-6xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Available Slots</h1>

        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-700"
        >
          ← Back
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT – SLOT LIST */}
        <div className="md:col-span-2 space-y-4">
          {slots.length === 0 && (
            <p className="opacity-60">No slots available</p>
          )}

          {slots.map((slot) => {
            const checked = selectedSlot?.uuid === slot.uuid;

            return (
              <label
                key={slot.uuid}
                className={`flex justify-between items-center p-4 rounded cursor-pointer ${
                  checked ? "ring-2 ring-red-500" : ""
                }`}
                style={{ border: border1 }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="slot"
                    checked={checked}
                    onChange={() => selectSlot(slot)}
                    className="mt-1"
                  />

                  <div>
                    <div className="font-medium">
                      {new Date(slot.start_datetime).toLocaleDateString()} –{" "}
                      {new Date(slot.end_datetime).toLocaleDateString()}
                    </div>

                    <div className="text-sm opacity-80">
                      {new Date(slot.start_datetime).toLocaleTimeString()} –{" "}
                      {new Date(slot.end_datetime).toLocaleTimeString()}
                    </div>

                    <div className="text-sm opacity-60">
                      Duration: {slot.duration_minutes} min
                    </div>
                  </div>
                </div>

                <div className="font-semibold text-red-600">
                  ₹{slot.price}
                </div>
              </label>
            );
          })}
        </div>

        {/* RIGHT – PAYMENT SUMMARY */}
        <div className={`rounded-xl p-5 h-fit sticky top-24 ${card}`}>
          <h2 className="text-lg font-semibold mb-4">
            Payment Summary
          </h2>

          {!selectedSlot ? (
            <div className="space-y-2 text-sm opacity-70">
              <div className="flex justify-between">
                <span>Duration</span>
                <span>0 min</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total Price</span>
                <span>₹0</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Date</span>
                <span>
                  {new Date(
                    selectedSlot.start_datetime
                  ).toLocaleDateString()} –{" "}
                  {new Date(
                    selectedSlot.end_datetime
                  ).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Time</span>
                <span>
                  {new Date(
                    selectedSlot.start_datetime
                  ).toLocaleTimeString()} –{" "}
                  {new Date(
                    selectedSlot.end_datetime
                  ).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Duration</span>
                <span>
                  {selectedSlot.duration_minutes} min
                </span>
              </div>

              <div className="flex justify-between font-semibold">
                <span>Total Price</span>
                <span>₹{selectedSlot.price}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleProceedToPay}
            disabled={!selectedSlot || paymentProcessing}
            className={`mt-4 w-full py-2 rounded text-white transition flex items-center justify-center gap-2 ${
              selectedSlot && !paymentProcessing
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {paymentProcessing ? "Processing..." : "Proceed to Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
