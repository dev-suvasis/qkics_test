// src/profiles/normalProfile.jsx
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearPostViewState } from "../redux/slices/postViewSlice";
import { FaUser, FaRocket, FaGraduationCap } from "react-icons/fa";
import { MdOutlineUpgrade } from "react-icons/md";


import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";


// Redux
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import {
  fetchUserProfile,
  setActiveProfileData,
  clearActiveProfileData,
  updateProfilePicture,
} from "../redux/slices/userSlice";
import { resolveMedia } from "../components/utils/mediaUrl";


// UI Components
import UserDetails from "../profiles/basicDetails/userDetails";
import UserPosts from "../profiles/basicDetails/userPosts";
import UserBadge from "../components/ui/UserBadge";
import ModalOverlay from "../components/ui/ModalOverlay";

export default function NormalProfile({
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { theme, activeProfileData } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile;

  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [showImageModal, setShowImageModal] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);


  /* -------------------------------
      TAB HANDLING
  ------------------------------- */
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("normalProfileTab") || "details";
  });

  useEffect(() => {
    sessionStorage.setItem("normalProfileTab", activeTab);
  }, [activeTab]);

  /* -------------------------------
      USER + EDIT FORM STATE
  ------------------------------- */
  const [profileUser, setProfileUser] = useState(profile || null);

  useEffect(() => {
    if (profile) setProfileUser(profile);
  }, [profile]);


  const [editMode, setEditMode] = useState(false);


  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  /* -------------------------------
      LOAD USER + DISPATCH POSTS
  ------------------------------- */
  useEffect(() => {
    if (disableSelfFetch) return;

    const loadProfile = async () => {
      try {
        const userRes = await axiosSecure.get("/v1/auth/me/");
        const user = userRes.data;

        setProfileUser(user);
        dispatch(setActiveProfileData({ role: "normal", profile: user }));

        setEditData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
        });

        dispatch(loadUserPosts(user.username));

        // ✅ ADD THIS LINE (sync Redux)
        dispatch(fetchUserProfile());
      } catch (err) {
        console.log("Profile load error:", err);
      }
    };

    loadProfile();

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);



  /* -------------------------------
      When Redux posts load → sync locally
  ------------------------------- */
  // Removed local posts sync as UserPosts now uses Redux directly

  /* -------------------------------
      SAVE USER INFO
  ------------------------------- */
  const handleSaveUser = async () => {
    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      setProfileUser(res.data.user);

      // ✅ SYNC ACTIVE PROFILE DATA
      dispatch(setActiveProfileData({ role: "normal", profile: res.data.user }));

      setEditData({
        first_name: res.data.user.first_name || "",
        last_name: res.data.user.last_name || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
      });

      // ✅ ADD THIS LINE
      dispatch(fetchUserProfile());

      setEditMode(false);
      showAlert("Profile updated successfully!", "success");
    } catch {
      showAlert("Failed updating profile", "error");
    }
  };


  /* -------------------------------
      UPDATE PROFILE PICTURE
  ------------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = res.data.user;
      setProfileUser(updatedUser);

      // Sync active profile so the profile page re-renders immediately
      dispatch(setActiveProfileData({ role: "normal", profile: updatedUser }));

      // ✅ Instantly update navbar profile pic — no second API call needed
      dispatch(updateProfilePicture(updatedUser.profile_picture));

      showAlert("Profile picture updated!", "success");
    } catch (err) {
      console.log("Profile pic upload error:", err);
      showAlert("Upload failed!", "error");
    }
  };


  // Delete logic moved to UserPosts component


  // Restore tab + scroll IF coming back from comments
  useEffect(() => {
    if (postView.from === "normal-profile") {
      if (postView.tab) {
        setActiveTab(postView.tab);
      }

      setTimeout(() => {
        window.scrollTo(0, postView.scroll || 0);
      }, 50);
    }
  }, [postView]);



  useEffect(() => {
    if (!profile || !readOnly) return;

    setEditData({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
  }, [profile, readOnly]);




  useEffect(() => {
    if (!profile || !readOnly) return;

    dispatch(loadUserPosts(profile.username));
  }, [profile, readOnly, dispatch]);



  /* -------------------------------
      LOADING STATE
  ------------------------------- */
  if (!profileUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ${isDark ? "text-white" : "text-black"}`}>Loading Profile...</span>
        </div>
      </div>
    );
  }

  /* -------------------------------
      MAIN UI
  ------------------------------- */
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
                {profileUser.profile_picture ? (
                  <img
                    src={`${resolveMedia(profileUser.profile_picture)}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-full h-full object-cover transform md:group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-red-600 flex items-center justify-center text-5xl font-black text-white">
                    {profileUser?.first_name
                      ? profileUser.first_name.charAt(0).toUpperCase()
                      : profileUser?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* EDIT BUTTON */}
              {!readOnly && (
                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shadow-xl cursor-pointer hover:bg-red-600 transition-colors z-20">
                  <MdEdit size={16} />
                  <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                <div>
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 ${text}`}>
                    {profileUser.first_name || profileUser.last_name
                      ? `${profileUser.first_name} ${profileUser.last_name}`
                      : profileUser.username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      @{profileUser?.username}
                    </span>
                    <UserBadge userType={profileUser.user_type || "normal"} />

                  </div>
                </div>

                {/* UPGRADE BUTTON */}
                <div className="flex-shrink-0 mt-4 md:mt-0">
                  {!readOnly && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
                    >
                      <MdOutlineUpgrade size={18} />
                      Upgrade Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap justify-center p-1.5 rounded-2xl glass transition-all shadow-xl">
            {['details', 'posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-neutral-500 hover:text-black dark:hover:text-white"
                  }`}
              >
                {tab === "details" ? "About" : "Posts"}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6 flex flex-col md:flex-row gap-8">
          <div className="flex-1 min-w-0 animate-fadeIn">
            {activeTab === "details" && (
              <div className="relative">
                <UserDetails
                  editMode={!readOnly && editMode}
                  setEditMode={readOnly ? () => { } : setEditMode}
                  editData={editData}
                  setEditData={readOnly ? () => { } : setEditData}
                  handleSave={handleSaveUser}
                />
              </div>
            )}

            {activeTab === "posts" && (
              <UserPosts />
            )}
          </div>
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <UpgradeModal
          close={() => setShowUpgradeModal(false)}
          navigate={navigate}
          isDark={isDark}
        />
      )}

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
              src={`${resolveMedia(profileUser.profile_picture)}?t=${Date.now()}`}
              className="w-80 h-80 md:w-96 md:h-96 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   UPGRADE MODAL — Always Works
---------------------------------------------------- */
function UpgradeModal({ close, navigate, isDark }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className={`w-full max-w-2xl rounded-3xl p-8 shadow-2xl transform transition-all animate-scaleIn ${isDark ? "bg-neutral-900 border border-white/5" : "bg-white"
          }`}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black tracking-tighter ${isDark ? "text-white" : "text-black"}`}>Method of Discovery</h2>
            <p className={`text-sm mt-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Choose how you want to contribute to the ecosystem.</p>
          </div>
          <button
            onClick={close}
            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-black/5 text-black"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => {
              close();
              navigate("/upgrade/expert");
            }}
            className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${isDark
              ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-red-500/50"
              : "bg-white border-neutral-200 hover:border-red-500/50"
              }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <FaGraduationCap size={24} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Become an Expert</h3>
            <p className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Share your specialized knowledge, offer consultations, and mentor others in your field.</p>
          </div>

          <div
            onClick={() => {
              close();
              navigate("/upgrade/entrepreneur");
            }}
            className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${isDark
              ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-500/50"
              : "bg-white border-neutral-200 hover:border-blue-500/50"
              }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <FaRocket size={24} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-black"}`}>Become an Entrepreneur</h3>
            <p className={`text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>Build your startup profile, showcase your innovations, and connect with investors.</p>
          </div>
        </div>
      </div>
    </div>
  );
}