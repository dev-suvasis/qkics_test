// src/pages/booking.jsx
import { useEffect, useState } from "react";
import axiosSecure from "../components/utils/axiosSecure";

import ExpertCard from "../components/profileFetch/expertBooking/ExpertCard";
import ExpertModal from "../components/profileFetch/expertBooking/ExpertModal";
import EntrepreneurCard from "../components/profileFetch/entreprenuerFetch/EntrepreneurCard";
import InvestorCard from "../components/profileFetch/investorFetch/InvestorCard";

import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Booking() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const TABS = {
    EXPERTS: "experts",
    ENTREPRENEURS: "entrepreneurs",
    INVESTORS: "investors",
  };   

  const [activeTab, setActiveTab] = useState(TABS.EXPERTS);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpert, setSelectedExpert] = useState(null);

  useEffect(() => {
    if (activeTab === TABS.EXPERTS) fetchExperts();
    else if (activeTab === TABS.ENTREPRENEURS) fetchEntrepreneurs();
    else if (activeTab === TABS.INVESTORS) fetchInvestors();
    else setItems([]);
  }, [activeTab]);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/experts/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load experts");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntrepreneurs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/entrepreneurs/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load entrepreneurs");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/investors/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load investors");
    } finally {
      setLoading(false);
    }
  };

  const resolveProfileImage = (expert) => {
    const url = expert.profile_picture || expert.user?.profile_picture;
    const name = expert.user?.first_name || expert.user?.username || "User";
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&length=1`;
    return `${url}?t=${Date.now()}`;
  };

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
    <div className={`min-h-screen px-4 max-w-7xl mx-auto md:pb-12 ${isDark ? "text-white" : "text-black"}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Our <span className="text-red-600">Professionals</span>
          </h1>
          <p className="opacity-50 font-medium max-w-xl leading-relaxed">
            Connect with verified experts, innovative entrepreneurs, and strategic investors in the global QKICS community.
          </p>
        </div>

        {/* ---------------- TABS ---------------- */}
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-2xl glass transition-all shadow-xl">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                ${activeTab === tab
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- LIST ---------------- */}
      {items.length === 0 ? (
        <div className="py-20 text-center opacity-30">
          <p className="text-sm font-black tracking-widest uppercase">
            No {activeTab} discovered in this sector yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fadeIn">
          {activeTab === TABS.EXPERTS &&
            items.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                isDark={isDark}
                onClick={() => setSelectedExpert(expert)}
                resolveProfileImage={resolveProfileImage}
              />
            ))}

          {activeTab === TABS.ENTREPRENEURS &&
            items.map((item) => (
              <EntrepreneurCard
                key={item.id}
                entrepreneur={item}
                isDark={isDark}
                onClick={(entrepreneur) => goToUserProfile(entrepreneur.user)}
              />
            ))}

          {activeTab === TABS.INVESTORS &&
            items.map((item) => (
              <InvestorCard
                key={item.id}
                investor={item}
                isDark={isDark}
                onClick={(investor) => goToUserProfile(investor.user)}
              />
            ))}
        </div>
      )}

      {/* ---------------- MODAL (EXPERT ONLY) ---------------- */}
      {activeTab === TABS.EXPERTS && selectedExpert && (
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
