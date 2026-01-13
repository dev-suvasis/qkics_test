import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import axiosSecure from "../utils/axiosSecure";
import useThemeClasses from "../utils/useThemeClasses";
import { useAlert } from "../../context/AlertContext";

export default function MyBookings({ theme }) {
  const isDark = theme === "dark";
  const { card, border } = useThemeClasses(isDark);
  const { showAlert } = useAlert();

  const user = useSelector((state) => state.user.data);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [now, setNow] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setNow(new Date());
  }, 60000); // update every minute

  return () => clearInterval(interval);
}, []);


  /* ---------------- FETCH BOOKINGS ---------------- */
  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const url =
        user.user_type === "expert"
          ? "/v1/bookings/?as_expert=true"
          : "/v1/bookings/";

      const res = await axiosSecure.get(url);

      // Sort by start_datetime (ascending)
      const sorted = [...res.data].sort(
        (a, b) =>
          new Date(a.start_datetime) - new Date(b.start_datetime)
      );

      setBookings(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
      showAlert("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STATUS LABEL ---------------- */
  const getStatusLabel = (booking) => {
    if (booking.cancelled_at) return "CANCELLED";
    if (booking.declined_at) return "DECLINED";
    if (booking.completed_at) return "COMPLETED";
    if (booking.confirmed_at) return "CONFIRMED";
    if (booking.paid_at) return "PAID";
    return booking.status;
  };

  const isChatEnabled = (booking) => {
  if (!booking.chat_room_id) return false;

  const start = new Date(booking.start_datetime);
  const end = new Date(booking.end_datetime);

  return now >= start && now <= end;
};


  /* ---------------- UI STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading bookings...
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

  return (
    <div className="pt-20 px-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {user.user_type === "expert"
          ? "Bookings with Clients"
          : "My Booked Sessions"}
      </h1>

      {bookings.length === 0 ? (
        <div className="text-center opacity-70">
          No bookings found
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.uuid}
              className={`rounded-lg p-4 border ${card} ${border}`}
            >
              {/* HEADER */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold">
                    {user.user_type === "expert"
                      ? booking.user_name
                      : booking.expert_name}
                  </div>
                  <div className="text-sm opacity-70">
                    {new Date(
                      booking.start_datetime
                    ).toLocaleDateString()}{" "}
                    •{" "}
                    {new Date(
                      booking.start_datetime
                    ).toLocaleTimeString()}{" "}
                    –{" "}
                    {new Date(
                      booking.end_datetime
                    ).toLocaleTimeString()}
                  </div>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    getStatusLabel(booking) === "CONFIRMED"
                      ? "bg-green-600 text-white"
                      : getStatusLabel(booking) === "PENDING"
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {getStatusLabel(booking)}
                </span>
              </div>

              {/* DETAILS */}
              <div className="text-sm grid grid-cols-2 gap-2 mt-3">
                <div>
                  <span className="opacity-60">Duration:</span>{" "}
                  {booking.duration_minutes} min
                </div>

                <div>
                  <span className="opacity-60">Price:</span> ₹
                  {booking.price}
                </div>

                {user.user_type === "expert" && (
                  <div>
                    <span className="opacity-60">
                      Your Earning:
                    </span>{" "}
                    ₹{booking.expert_earning_amount}
                  </div>
                )}

                <div>
                  <span className="opacity-60">
                    Requires Approval:
                  </span>{" "}
                  {booking.requires_expert_approval ? "Yes" : "No"}
                </div>
              </div>

              {/* CHAT */}
              {booking.chat_room_id && (
  <div className="mt-4">
    <button
      disabled={!isChatEnabled(booking)}
      onClick={() =>
        console.log(
          "Navigate to chat:",
          booking.chat_room_id
        )
      }
      className={`px-4 py-2 rounded text-sm font-medium transition ${
        isChatEnabled(booking)
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-gray-400 text-gray-700 cursor-not-allowed"
      }`}
    >
      {isChatEnabled(booking)
        ? "Open Chat"
        : "Chat available at session time"}
    </button>
  </div>
)}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
