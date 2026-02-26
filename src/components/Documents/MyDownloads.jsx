import { useEffect, useState, useRef } from "react";
import axiosSecure from "../utils/axiosSecure";
import { FaDownload, FaHistory } from "react-icons/fa";

export default function MyDownloads({ theme, searchQuery = "" }) {
  const isDark = theme === "dark";
  const [downloads, setDownloads] = useState([]);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDownloads(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchDownloads = async (query = "") => {
    try {
      const res = await axiosSecure.get(`/v1/documents/my-downloads/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setDownloads(Array.isArray(data) ? data : (data?.results || []));
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
      setDownloads((prev) => [...prev, ...newItems]);
      setNext(data?.next || null);
    } catch (err) {
      console.error("Failed to load more downloads", err);
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

  return (
    <div className={`premium-card overflow-hidden animate-fadeIn ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"}`}>
      <div className={`p-8 border-b flex items-center justify-between ${isDark ? "border-white/5" : "border-black/5"}`}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 shadow-inner">
            <FaHistory size={20} />
          </div>
          <div>
            <h2 className={`text-xl font-black tracking-tight `}>Download History</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Asset Collective</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-0.5">Total Assets</p>
          <p className={`text-sm font-black `}>{downloads.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`${isDark ? "bg-white/5" : "bg-black/5"}`}>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40">Document Intelligence</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Status</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-black/5"}`}>
            {downloads.length > 0 ? (
              downloads.map((d, i) => (
                <tr key={i} className={`group transition-all duration-300 ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-500 ${isDark ? "bg-white/5" : "bg-black/5"} group-hover:bg-red-500 group-hover:text-white`}>
                        <FaDownload size={14} />
                      </div>
                      <span className={`font-bold text-sm group-hover:text-red-500 transition-colors `}>{d.document_title}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border shadow-sm transition-all duration-500 ${d.access_type_snapshot === "PREMIUM"
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/10"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                      }`}>
                      {d.access_type_snapshot}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black `}>
                        {new Date(d.downloaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">
                        {new Date(d.downloaded_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-20 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-20 italic">No assets discovered in your local collection yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-black/10 dark:border-white/10" />
        </div>
      )}
    </div>
  );
}
