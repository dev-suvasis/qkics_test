import { useEffect } from "react";
import { createPortal } from "react-dom";

const Alert = ({ message, type = "info", title, onClose }) => {
  // Auto close after 5 seconds
  console.log("Alert rendered with message:", title, message);
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: "bg-green-100 text-green-700",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600 text-white",
  };

  return createPortal(
    <div
      className={`
        fixed top-14 right-5 z-[10001] 
        px-5 py-3 rounded-md shadow-lg 
        flex items-center gap-3 
        ${colors[type] || colors.info}
        animate-slide-in
      `}
    >
      <span className="text-sm font-medium">
        {message}
      </span>

      <button
        className="text-lg font-bold opacity-70 hover:opacity-100"
        onClick={onClose}
      >
        ×
      </button>
    </div>,
    document.body
  );
};

export default Alert;
