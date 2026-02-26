import { useEffect, useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FiDownload, FiX, FiCalendar, FiShield } from "react-icons/fi";

export default function DocumentDetailsModal({ uuid, onClose, theme }) {
  const isDark = theme === "dark";
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await axiosSecure.get(`/v1/documents/${uuid}/`);
      setDoc(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError("");
    try {
      const res = await axiosSecure.get(
        `/v1/documents/${uuid}/download/`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title}.pdf`;
      link.click();
    } catch (err) {
      setError(err.response?.data?.detail || "Download failed. You might not have access.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!doc) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`p-8 rounded-2xl animate-pulse ${isDark ? "bg-neutral-800" : "bg-white"}`}>
        <div className={`w-64 h-4 rounded mb-4 ${isDark ? "bg-neutral-700" : "bg-gray-200"}`}></div>
        <div className={`w-48 h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-100"}`}></div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl ${isDark ? "bg-neutral-900 border border-neutral-800 text-white" : "bg-white text-gray-900"
          }`}
      >
        {/* Modal Header */}
        <div className="relative p-8 pb-4">
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDark ? "hover:bg-neutral-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
          >
            <FiX className="text-xl" />
          </button>

          <div className="flex items-center gap-2 mb-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
            <FiShield /> Document Insight
          </div>
          <h3 className="text-2xl font-extrabold leading-tight">{doc.title}</h3>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-4">
          <p className={`text-base leading-relaxed mb-6 ${isDark ? "text-neutral-400" : "text-gray-600"}`}>
            {doc.description}
          </p>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${isDark ? "bg-neutral-800 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <FiCalendar />
              </span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Published</p>
                <p className="font-semibold">{new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg ${isDark ? "bg-neutral-800" : "bg-amber-50 text-amber-600"}`}>
                <FiShield />
              </span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Access</p>
                <p className={`font-semibold ${doc.access_type === 'PREMIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>{doc.access_type}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className={`mt-6 p-4 rounded-xl border text-sm flex items-center gap-2 animate-shake ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600"}`}>
              <FiX className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-8 mt-4 flex gap-3 ${isDark ? "bg-neutral-800/50" : "bg-gray-50"}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-6 py-3 font-bold rounded-xl border transition-all ${isDark
              ? "border-neutral-700 hover:bg-neutral-700 text-white"
              : "border-gray-200 hover:bg-white hover:border-gray-300 text-gray-700"
              }`}
          >
            Dismiss
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex-[2] px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${isDownloading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
              }`}
          >
            {isDownloading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <FiDownload className="text-lg" />
            )}
            {isDownloading ? "Preparing..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
