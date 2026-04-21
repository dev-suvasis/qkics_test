import { useEffect, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";


export default function SlotForm({
  initialData,
  onSave,
  onCancel,
  isDark,
}) {
  const isEdit = Boolean(initialData);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [duration, setDuration] = useState(0);
  const [chatPrice, setChatPrice] = useState("");
  const [videoCallPrice, setVideoCallPrice] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);

  // Helper: Convert Date or ISO string to local YYYY-MM-DDTHH:mm
  const toLocalString = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  /* ----------------------------
      PREFILL (EDIT MODE)
  ----------------------------- */
  useEffect(() => {
    if (!initialData) return;

    setStart(toLocalString(initialData.start_datetime));
    setEnd(toLocalString(initialData.end_datetime));
    setDuration(initialData.duration_minutes || 0);
    setChatPrice(initialData.chat_price || "");
    setVideoCallPrice(initialData.video_call_price || "");
    setRequiresApproval(initialData.requires_approval);
  }, [initialData]);

  // Recalculate duration when times change
  useEffect(() => {
    if (!start || !end) {
      setDuration(0);
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (endDate > startDate) {
        const diffMinutes = (endDate - startDate) / (1000 * 60);
        setDuration(Math.round(diffMinutes));
      } else {
        setDuration(0);
      }
    }
  }, [start, end]);

  /* ----------------------------
      SUBMIT
  ----------------------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!start || !end) {
      showAlert("Start and end times are required", "error");
      return;
    }

    if ((chatPrice === "" || chatPrice === null) && (videoCallPrice === "" || videoCallPrice === null)) {
      showAlert("At least one price (Chat or Video Call) must be set", "error");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      showAlert("End time must be after start time", "error");
      return;
    }

    const chatPriceVal = Number(chatPrice) || 0;
    const videoCallPriceVal = Number(videoCallPrice) || 0;

    const payload = {
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      duration_minutes: Number(duration),
      chat_price: chatPriceVal,
      video_call_price: videoCallPriceVal,
      requires_approval: requiresApproval,
      is_chat_available: chatPriceVal > 0,
      is_video_call_available: videoCallPriceVal > 0,
    };

    // Confirmation Logic
    const chatMsg = chatPriceVal > 0 ? `₹${chatPriceVal}` : "Not Available";
    const videoMsg = videoCallPriceVal > 0 ? `₹${videoCallPriceVal}` : "Not Available";

    showConfirm({
      title: isEdit ? "Update Slot" : "Create Slot",
      message: (
        <div className="space-y-2">
          <p>Please confirm the slot details:</p>
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="opacity-60">Chat Consultation:</span>
              <span className={`font-bold ${chatPriceVal > 0 ? "text-green-500" : "text-red-500"}`}>{chatMsg}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Video Call:</span>
              <span className={`font-bold ${videoCallPriceVal > 0 ? "text-green-500" : "text-red-500"}`}>{videoMsg}</span>
            </div>
          </div>
          {(chatPriceVal === 0 || videoCallPriceVal === 0) && (
            <p className="text-xs text-red-500 font-medium mt-2">
              Note: Features with "Not Available" cannot be booked by users for this slot.
            </p>
          )}
        </div>
      ),
      confirmText: isEdit ? "Update" : "Create",
      cancelText: "Cancel",
      onConfirm: () => {
        onSave(payload, initialData?.uuid);
      }
    });
  };

  const inputClass = `w-full bg-transparent border-b-2 font-medium focus:outline-none transition-all pb-2 ${isDark
      ? "border-white/20 focus:border-red-500 text-white placeholder-neutral-600"
      : "border-black/10 focus:border-red-500 text-black placeholder-neutral-400"
    }`;

  const labelClass = `block text-xs font-black uppercase tracking-widest mb-3 ${isDark ? "text-neutral-500" : "text-neutral-400"}`;

  return (
    <form
      onSubmit={handleSubmit}
      className={`${isDark ? "text-white" : "text-black"}`}
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          {isEdit ? "Edit" : "Create"} <span className="text-red-600">Slot</span>
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className={`text-2xl hover:text-red-500 transition-colors ${isDark ? "text-white" : "text-black"}`}
        >
          &times;
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className={labelClass}>
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            value={start}
            min={toLocalString(new Date())}
            onChange={(e) => setStart(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={end}
            min={start || toLocalString(new Date())}
            onChange={(e) => setEnd(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
        </div>

        <div>
          <label className={labelClass}>
            Chat Price (₹)
          </label>
          <input
            type="number"
            min={0}
            value={chatPrice}
            onChange={(e) => setChatPrice(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className={labelClass}>
            Video Call Price (₹)
          </label>
          <input
            type="number"
            min={0}
            value={videoCallPrice}
            onChange={(e) => setVideoCallPrice(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"}`}>
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="w-5 h-5 accent-red-600 rounded"
          />
          <span className="font-medium text-sm">Requires approval before booking confirmation</span>
        </label>
      </div>


      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
        >
          {isEdit ? "Update Slot" : "Create Slot"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 py-3 border rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark
            ? "border-white/10 hover:bg-white/5 text-white"
            : "border-black/10 hover:bg-black/5 text-black"
            }`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
