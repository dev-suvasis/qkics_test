// src/pages/booking.jsx
import { useEffect, useState, useRef } from "react";
import axiosSecure from "../components/utils/axiosSecure";

import ExpertCard from "../components/profileFetch/expertBooking/ExpertCard";
import ExpertModal from "../components/profileFetch/expertBooking/ExpertModal";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Booking() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchExperts(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchExperts = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get(`/v1/experts/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setItems(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load experts");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!next) return;
    try {
      const res = await axiosSecure.get(next);
      const data = res.data;
      const newItems = Array.isArray(data) ? data : (data?.results || []);
      setItems((prev) => [...prev, ...newItems]);
      setNext(data?.next || null);
    } catch (err) {
      console.error("Failed to load more", err);
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

  const resolveProfileImage = (expert) => {
    const url = expert.profile_picture || expert.user?.profile_picture;
    const name = expert.user?.first_name || expert.user?.username || "User";
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=1`;
    return `${url}?t=${Date.now()}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-black"}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-red-500 border-white/10" />
        <p className="text-xs font-bold tracking-[0.2em] opacity-40 uppercase">Mapping Talent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold uppercase tracking-widest bg-[#0a0a0a]">
        {error}
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-8 max-w-7xl mx-auto md:pb-12 ${isDark ? "text-white" : "text-black"}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Our <span className="text-red-600">Professionals</span>
          </h1>
          <p className="opacity-50 font-medium max-w-xl leading-relaxed">
            Connect with verified experts in the global QKICS community.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Professionals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full md:w-80 px-5 py-3 rounded-full text-sm font-bold border transition-all ${isDark
                ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500 hover:bg-white/10"
                : "bg-black/5 border-black/10 text-black placeholder:text-black/30 focus:border-red-500 hover:bg-black/10"
              } outline-none`}
          />
        </div>
      </div>

      {(!Array.isArray(items) || items.length === 0) ? (
        <div className="py-20 text-center opacity-30">
          <p className="text-sm font-black tracking-widest uppercase">
            No experts discovered yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
          {items?.map((expert) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              isDark={isDark}
              onClick={() => setSelectedExpert(expert)}
              resolveProfileImage={resolveProfileImage}
            />
          ))}
        </div>
      )}

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-white/10" />
        </div>
      )}

      {selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
          resolveProfileImage={resolveProfileImage}
          isDark={isDark}
        />
      )}
    </div>
  );
}
