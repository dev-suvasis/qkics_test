import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const ConfirmationAlert = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  // ✅ isDark was previously an undefined free variable — caused ReferenceError crash every time
  // the confirm dialog rendered. Now correctly read from Redux.
  const theme = useSelector((state) => state.user.theme);
  const isDark = theme === "dark";

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative ${isDark ? "bg-neutral-900 border border-white/10" : "bg-white"} rounded-[2rem] shadow-2xl w-full max-w-md p-8 md:p-10 animate-pop`}
      >
        {/* Title */}
        <h2 className={`text-xl font-black uppercase tracking-tight text-center ${isDark ? "text-white" : "text-gray-900"}`}>
          {title}
        </h2>

        {/* Message */}
        <p className={`mt-4 text-center text-sm font-medium leading-relaxed ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
          {message}
        </p>

        {/* Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 text-white hover:bg-white/10" : "bg-neutral-100 text-black hover:bg-neutral-200"
              }`}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationAlert;