import { useEffect, useState, useRef } from "react";
import axiosSecure from "../components/utils/axiosSecure";
import { FaEye, FaFileAlt } from "react-icons/fa";
import DocumentDetailsModal from "../components/Documents/DocumentDetailsModal";

export default function DocumentList({ theme, searchQuery = "", filter = "all", refreshTrigger = 0 }) {
  const isDark = theme === "dark";
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocuments(searchQuery, filter);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filter, refreshTrigger]);

  const fetchDocuments = async (query = "", currentFilter = "all") => {
    try {
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (currentFilter !== "all" && currentFilter !== "downloads") {
        params.append("access_type", currentFilter.toUpperCase());
      }

      const res = await axiosSecure.get(`/v1/documents/?${params.toString()}`);
      const data = res.data;
      setDocuments(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMore = async () => {
    if (!next) return;
    try {
      const res = await axiosSecure.get(next);
      const data = res.data;
      const newItems = Array.isArray(data) ? data : (data?.results || []);
      setDocuments((prev) => [...prev, ...newItems]);
      setNext(data?.next || null);
    } catch (err) {
      console.error("Failed to load more documents", err);
    }
  };

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [next]);

  const text = isDark ? "text-white" : "text-black";

  return (
    <div className="max-w-7xl py-8 mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {documents?.map((doc) => (
          <div
            key={doc.uuid}
            className={`group relative p-4 premium-card transition-all duration-500 hover:shadow-xl animate-fadeIn ${isDark ? "bg-neutral-900" : "bg-white"}`}
          >
            {/* Icon & Access Badge */}
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                <FaFileAlt size={18} />
              </div>
              <span
                className={`text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border shadow-sm transition-all duration-500 ${doc.access_type === "PREMIUM"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}
              >
                {doc.access_type}
              </span>
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className={`font-black text-lg leading-tight mb-2 group-hover:text-red-500 transition-colors ${text}`}>
                {doc.title}
              </h3>
              <p className={`text-xs font-medium leading-relaxed opacity-50 line-clamp-2 ${text}`}>
                {doc.description}
              </p>
            </div>

            <div className={`w-full h-px mb-4 ${isDark ? "bg-white/5" : "bg-black/5"}`} />

            {/* Footer */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-0.5">Updated</span>
                <span className={`text-[10px] font-bold ${text}`}>
                  {new Date(doc.updated_at || doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedDoc(doc.uuid)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isDark
                  ? "bg-white/5 text-white hover:bg-neutral-800"
                  : "bg-black/5 text-black hover:bg-neutral-900 hover:text-white"}`}
              >
                <FaEye size={12} />
                <span>Analyze</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-black/10 dark:border-white/10" />
        </div>
      )}

      {selectedDoc && (
        <DocumentDetailsModal
          uuid={selectedDoc}
          theme={theme}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
