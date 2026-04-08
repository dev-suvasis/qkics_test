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

   useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocuments(searchQuery, filter);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filter, refreshTrigger]);

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
    <div className="max-w-7xl py-1 mx-auto px-1">
      <div className="flex flex-col gap-3 md:gap-4">
        {documents?.map((doc) => (
          <div
            key={doc.uuid}
            className={`group flex items-center gap-4 md:gap-6 p-2 md:p-2 rounded-xl md:rounded-xl border transition-all duration-500 hover:scale-[1.002] hover:shadow-xl animate-fadeIn ${isDark 
              ? "bg-neutral-900/40 border-white/5 hover:bg-neutral-900 hover:border-white/10" 
              : "bg-white border-black/5 hover:border-black/10 shadow-sm"}`}
          >
            {/* Left: Icon */}
            <div className="flex-shrink-0">
              <div className="h-10 w-10 md:h-10 md:w-10 rounded-xl md:rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 shadow-inner group-hover:bg-red-600 group-hover:text-white transition-all duration-500 relative">
                <FaFileAlt size={18} className="md:size-5 relative z-10" />
              </div>
            </div>

            {/* Middle: Content */}
            <div className="flex-grow min-w-0 pr-1 md:pr-4">
              <div className="flex items-center gap-2 md:gap-4 mb-0.5 md:mb-1 overflow-hidden">
                <h3 className={`font-black text-sm md:text-base truncate group-hover:text-red-500 transition-colors ${text}`}>
                  {doc.title}
                </h3>
                <span
                  className={`flex-shrink-0 text-[7px] md:text-[8px] uppercase font-black tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${doc.access_type === "PREMIUM"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}
                >
                  {doc.access_type}
                </span>
              </div>
              {/* <p className={`text-[10px] md:text-sm font-medium opacity-50 line-clamp-1 max-w-2xl ${text}`}>
                {doc.description}
              </p> */}
            </div>

            {/* Right: Date & Action */}
            <div className="flex items-center gap-3 md:gap-10 flex-shrink-0">
              {/* Date hidden on very small mobile if needed, but keeping it small */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-30 mb-0.5">Updated</span>
                <span className={`text-[10px] md:text-[12px] font-bold whitespace-nowrap ${text}`}>
                  {new Date(doc.updated_at || doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <button
                onClick={() => setSelectedDoc(doc.uuid)}
                className={`flex items-center gap-2 md:gap-3 px-4 md:px-4 py-2.5 md:py-2 rounded-xl md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isDark
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-black text-white hover:bg-neutral-800"}`}
              >
                <FaEye size={12} className="md:size-3.5" />
                <span className="hidden xs:inline">Analyze</span>
                <span className="xs:hidden">View</span>
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
