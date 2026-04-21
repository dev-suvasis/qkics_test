import { MdEdit, MdDelete } from "react-icons/md";
import { MdOutlineSchedule } from "react-icons/md";

export default function InvestorSlotCard({
  slot,
  onEdit,
  onDelete,
  onReschedule,
  isDark,
}) {
  const start = new Date(slot.start_datetime);
  const end = new Date(slot.end_datetime);

  // ✅ BACKEND IS SOURCE OF TRUTH
  const isAvailable = Boolean(slot.is_available);

  const sameDay = start.toLocaleDateString() === end.toLocaleDateString();

  return (
    <div
      className={`group p-6 rounded-3xl shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${isDark
        ? "bg-white/5 border-white/5 hover:border-red-500/30 text-white"
        : "bg-white border-neutral-100 hover:border-red-500/30 text-black"
        }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col w-full">
          <span className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Date & Duration</span>
          <div className="flex justify-between items-center w-full">
            <div className="font-bold text-lg flex items-center gap-2">
              <MdOutlineSchedule className={`text-red-500`} />
              <span>
                {start.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}{" "}
              </span>
            </div>
            <span className={`font-bold text-xs px-3 py-1 rounded-lg bg-red-600/10 text-red-600`}>
              {slot.duration_minutes} mins
            </span>
          </div>
          <div className="text-sm font-medium opacity-80 pl-6 mt-1">
            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {!sameDay && `${end.toLocaleDateString()} • `}
            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className={`h-px w-full my-4 ${isDark ? "bg-white/10" : "bg-black/5"}`}></div>

      {/* STATUS BADGES */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${slot.status === "ACTIVE"
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
            }`}
        >
          {slot.status}
        </span>

        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isAvailable
            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}
        >
          {isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      {/* ACTIONS */}
      {/* <div className="flex gap-2">
        {isAvailable ? (
          <>
            <button
              onClick={onEdit}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${isDark
                ? "bg-white/5 hover:bg-white/10 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-black"
                }`}
            >
              <MdEdit size={14} /> Edit
            </button>

            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <MdDelete size={14} /> Delete
            </button>
          </>
        ) : (
          <button
            onClick={onReschedule}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <MdOutlineSchedule size={14} /> Reschedule
          </button>
        )}
      </div> */}
    </div>
  );
}
