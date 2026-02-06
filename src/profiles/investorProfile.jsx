// src/profiles/investor/InvestorProfile.jsx

import { useEffect, useState, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";

import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaBriefcase } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts } from "../redux/slices/postsSlice";
import { fetchUserProfile, setActiveProfileData, clearActiveProfileData } from "../redux/slices/userSlice";

import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";
import InvestorDetails from "./InvestorDetails/InvestorDetails";
import ModalOverlay from "../components/ui/ModalOverlay";
import UserBadge from "../components/ui/UserBadge";

import { MdOutlineManageAccounts } from "react-icons/md";
import { RiFundsLine } from "react-icons/ri";



export default function InvestorProfile({
  profile: propProfile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { theme, activeProfileData, data: loggedUser } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile || propProfile;

  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const postsRedux = useSelector((state) => state.posts.items);

  const reduxUser = useSelector((state) => state.user.data);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  /* --------------------------
      USER + INVESTOR DATA
  --------------------------- */
  const [investorData, setInvestorData] = useState(profile || null);
  const user = investorData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (profile) setInvestorData(profile);
  }, [profile]);

  /* --------------------------
      POSTS STATE
  --------------------------- */
  // Removed local posts sync as UserPosts now uses Redux directly

  useEffect(() => {
    if (!readOnly && user?.username) {
      dispatch(loadUserPosts(user.username));
    }
  }, [readOnly, user?.username, dispatch]);

  useEffect(() => {
    if (!profile || !readOnly) return;
    dispatch(loadUserPosts(profile.user.username));
  }, [profile, readOnly, dispatch]);

  /* --------------------------
      TAB STATE
  --------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("investorActiveTab") || "about"
  );

  useEffect(() => {
    sessionStorage.setItem("investorActiveTab", activeTab);
  }, [activeTab]);

  const [leftActive, setLeftActive] = useState("user-details");

  /* --------------------------
      EDIT USER STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (!editUser || !user) return;

    setEditData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
  }, [editUser, user]);

  /* --------------------------
      FETCH SELF PROFILE
  --------------------------- */
  useEffect(() => {
    if (!disableSelfFetch) {
      axiosSecure.get("/v1/investors/me/profile/").then((res) => {
        setInvestorData(res.data);
        dispatch(setActiveProfileData({ role: "investor", profile: res.data }));
        dispatch(fetchUserProfile());
      });
    }

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);

  /* --------------------------
      SAVE USER
  --------------------------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      setInvestorData((prev) => {
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            first_name: editData.first_name,
            last_name: editData.last_name,
            phone: editData.phone ?? prev.user.phone,
          },
        };
        // ✅ SYNC ACTIVE PROFILE DATA
        dispatch(setActiveProfileData({ role: "investor", profile: updated }));
        return updated;
      });

      setEditData({ ...editData });
      dispatch(fetchUserProfile());

      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to update user details", "error");
    }
  };

  /* --------------------------
      PROFILE PIC UPLOAD
  --------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = {
        ...investorData,
        user: res.data.user,
      };
      setInvestorData(updated);

      // ✅ SYNC ACTIVE PROFILE DATA
      dispatch(setActiveProfileData({ role: "investor", profile: updated }));

      dispatch(fetchUserProfile());
      showAlert("Profile picture updated!", "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to upload profile picture", "error");
    }
  };

  /* --------------------------
      SCROLL HANDLING
  --------------------------- */

  /* --------------------------
      SCROLL HANDLING
  --------------------------- */
  const userRef = useRef(null);
  const investorRef = useRef(null);
  const isUserScrolling = useRef(true);

  const scrollToSection = (ref, key) => {
    setLeftActive(key);
    isUserScrolling.current = false;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  useEffect(() => {
    const NAV_HEIGHT = 60;

    const handleScroll = () => {
      if (!isUserScrolling.current) return;

      const offset = NAV_HEIGHT + 40;
      const sections = [
        { key: "user-details", el: userRef.current },
        { key: "investor-details", el: investorRef.current },
      ];

      let closest = "user-details";
      let min = Infinity;

      sections.forEach((s) => {
        if (!s.el) return;
        const d = Math.abs(s.el.getBoundingClientRect().top - offset);
        if (d < min) {
          min = d;
          closest = s.key;
        }
      });

      setLeftActive(closest);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* --------------------------
      LOADING
  --------------------------- */
  if (!user || !investorData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${isDark ? "text-white" : "text-black"}`}>Loading Profile...</span>
        </div>
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */
  const text = isDark ? "text-white" : "text-black";

  return (
    <div className={`min-h-screen px-4 md:px-8 ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className={`premium-card p-8 md:p-12 mb-12 animate-fadeIn ${isDark ? "bg-neutral-900" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">

            {/* PROFILE PICTURE */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-transparent group-hover:ring-red-500/20 transition-all duration-700">
                {user.profile_picture ? (
                  <img
                    src={`${user.profile_picture}?t=${Date.now()}`}
                    className="w-full h-full object-cover transform md:group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-4xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* EDIT BUTTON */}
              {!readOnly && (
                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shadow-xl cursor-pointer hover:bg-blue-600 transition-colors z-20">
                  <MdEdit size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
                </label>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                <div>
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 ${text}`}>
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      @{user?.username}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <FaBriefcase size={12} /> Investor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap justify-center p-1.5 rounded-2xl glass transition-all shadow-xl">
            {['about', 'posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "about" && (
            <div className="flex flex-col lg:flex-row gap-8 relative">

              {/* SIDEBAR NAVIGATION */}
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className={`sticky top-32 p-4 rounded-3xl border transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl"}`}>
                  <button
                    onClick={() => scrollToSection(userRef, "user-details")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all mb-1 ${leftActive === "user-details"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                      }`}
                  >
                    <MdOutlineManageAccounts size={18} /> User Details
                  </button>

                  <button
                    onClick={() => scrollToSection(investorRef, "investor-details")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all mb-1 ${leftActive === "investor-details"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                      }`}
                  >
                    <RiFundsLine size={18} />
                    <span>Investor Details</span>
                  </button>
                </div>
              </div>


              {/* MAIN CONTENT AREA */}
              <div className="flex-1 space-y-12 min-w-0">
                <div ref={userRef} className="scroll-mt-32">
                  <UserDetails
                    editMode={!readOnly && editUser}
                    setEditMode={readOnly ? () => { } : setEditUser}
                    editData={editData}
                    setEditData={readOnly ? () => { } : setEditData}
                    handleSave={handleSaveUser}
                  />
                </div>

                <div ref={investorRef} className="scroll-mt-32">
                  <InvestorDetails
                    investorData={investorData}
                    setInvestorData={setInvestorData}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <UserPosts />
          )}
        </div>
      </div>

      {/* PROFILE PICTURE MODAL */}
      {showImageModal && (
        <ModalOverlay close={() => setShowImageModal(false)}>
          <div className={`relative p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center animate-pop ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
            <button
              onClick={() => setShowImageModal(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={`${user.profile_picture}?t=${Date.now()}`}
              alt="Profile Large"
              className="w-80 h-80 md:w-96 md:h-96 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
