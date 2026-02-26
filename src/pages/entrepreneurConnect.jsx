// src/pages/entrepreneurConnect.jsx
import { useEffect, useState, useRef } from "react";
import axiosSecure from "../components/utils/axiosSecure";
import InvestorCard from "../components/profileFetch/investorFetch/InvestorCard";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function EntrepreneurConnect() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInvestors(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchInvestors = async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get(`/v1/investors/?search=${encodeURIComponent(query)}`);
      const data = res.data;
      setItems(Array.isArray(data) ? data : (data?.results || []));
      setNext(data?.next || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load investors");
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

  const goToUserProfile = (user) => {
    if (!loggedUser) {
      navigate(`/profile/${user.username}`);
      return;
    }

    if (loggedUser.username === user.username) {
      switch (loggedUser.user_type) {
        case "expert": navigate("/expert"); break;
        case "entrepreneur": navigate("/entrepreneur"); break;
        case "investor": navigate("/investor"); break;
        case "admin": navigate("/admin"); break;
        case "superadmin": navigate("/superadmin"); break;
        default: navigate("/normal");
      }
      return;
    }
    navigate(`/profile/${user.username}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-black"}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-red-500 border-white/10" />
        <p className="text-xs font-bold tracking-[0.2em] opacity-40 uppercase">Mapping Investors...</p>
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
            Connect with <span className="text-red-600">Investors</span>
          </h1>
          <p className="opacity-50 font-medium max-w-xl leading-relaxed">
            Connect with strategic investors in the global QKICS community.
          </p>
        </div>
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Investors..."
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
            No investors discovered yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
          {items?.map((item) => (
            <InvestorCard
              key={item.id}
              investor={item}
              isDark={isDark}
              onClick={(investor) => goToUserProfile(investor.user)}
            />
          ))}
        </div>
      )}

      {next && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-white/10" />
        </div>
      )}
    </div>
  );
}
