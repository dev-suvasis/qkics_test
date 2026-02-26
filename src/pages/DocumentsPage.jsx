import { useState } from "react";
import { useSelector } from "react-redux";
import { FaPlus } from "react-icons/fa6";
import Document from "./document";
import MyDownloads from "../components/Documents/MyDownloads";
import UploadDocumentModal from "../components/Documents/UploadDocumentModal";

export default function DocumentsPage() {
  const { theme } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen px-4 py-8 max-w-7xl mx-auto `}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 animate-fadeIn">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Resource <span className="text-red-600">Library</span>
          </h1>
          <p className="opacity-50 font-medium leading-relaxed">
            Access curated professional intelligence, technical documentation, and your personal asset collective.
          </p>
        </div>

        <div className="flex flex-col items-end gap-6 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search Documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-80 px-5 py-3 rounded-full text-sm font-bold border transition-all ${isDark
                ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500 hover:bg-white/10"
                : "bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-red-500 hover:bg-black/10"
                } outline-none`}
            />
            <button
              className="group flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white font-bold shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98] whitespace-nowrap"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <FaPlus size={14} />
              <span className="text-sm tracking-wide uppercase">Upload</span>
            </button>
          </div>

          {/* Premium Segmented Control Tabs */}
          <div className={`inline-flex flex-wrap justify-center p-1.5 rounded-2xl transition-all shadow-xl ${isDark ? "bg-white/5" : "bg-black/5"}`}>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "all"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("free")}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "free"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
            >
              Free
            </button>
            <button
              onClick={() => setActiveTab("premium")}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "premium"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
            >
              Premium
            </button>
            <button
              onClick={() => setActiveTab("downloads")}
              className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "downloads"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : isDark ? "text-neutral-500 hover:text-white" : "text-neutral-500 hover:text-black"
                }`}
            >
              My Downloads
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="animate-fadeIn">
        {activeTab !== "downloads" ? (
          <Document theme={theme} searchQuery={searchQuery} filter={activeTab} refreshTrigger={refreshTrigger} />
        ) : (
          <div className="max-w-6xl mx-auto">
            <MyDownloads theme={theme} searchQuery={searchQuery} />
          </div>
        )}
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        theme={theme}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
          setIsUploadModalOpen(false);
        }}
      />
    </div>
  );
}
