import { createPortal } from "react-dom";
import { useEffect } from "react";

const ConfirmationAlert = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-pop"
      >
        {/* Icon */}
        {/* <div className="mx-auto mb-3 flex items-center justify-center h-14 w-14 rounded-full bg-red-100 text-red-600 text-4xl">
          !
        </div> */}

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-gray-800">
          {title}
        </h2>

        {/* Message */}
        <p className="mt-2 text-center text-gray-600 text-sm">
          {message} 
        </p>

        {/* Buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition shadow"
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
