import { useEffect, useState, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdOutlineEventAvailable } from "react-icons/md";


import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import {
  fetchUserProfile,
  setActiveProfileData,
  clearActiveProfileData,
  updateProfilePicture,
} from "../redux/slices/userSlice";
import { resolveMedia } from "../components/utils/mediaUrl";


// Shared Components
import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";


import ModalOverlay from "../components/ui/ModalOverlay";

// Expert Components
import ExpertDetails from "./expertDetails/expertDetails";
import ExperiencePage from "./expertDetails/expertExperience";
import EducationPage from "./expertDetails/expertEducation";
import CertificationPage from "./expertDetails/expertCertification";
import HonorsPage from "./expertDetails/expertHonors";

// Sidebar Icons
import { MdOutlineManageAccounts } from "react-icons/md";
import { HiOutlineIdentification } from "react-icons/hi";
import { MdWorkOutline } from "react-icons/md";
import {
  PiBookOpenTextLight,
  PiCertificateLight,
  PiMedalLight,
} from "react-icons/pi";

export default function ExpertProfile({
  profile: propProfile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { theme, activeProfileData, data: loggedUser } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile || propProfile;

  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const navigate = useNavigate();


  /* --------------------------
      USER + EXPERT STATE
  --------------------------- */
  const [expertData, setExpertData] = useState(profile || null);
  const user = expertData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (profile) setExpertData(profile);
  }, [profile]);

  /* --------------------------
      EDIT FORM STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editExp, setEditExp] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
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
      POSTS STATE
  --------------------------- */
  const postsState = useSelector((state) => state.posts.items);
  const [posts, setPosts] = useState([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    setPosts(postsState);
  }, [postsState]);
  // Removed local posts sync as UserPosts now uses Redux directly

  // Load posts for viewed profile
  useEffect(() => {
    if (!expertData || !readOnly) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [expertData, readOnly, dispatch]);

  // 🔑 LOAD POSTS FOR OWN EXPERT PROFILE
  useEffect(() => {
    if (readOnly || !expertData?.user?.username) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [readOnly, expertData?.user?.username, dispatch]);


  /* --------------------------
      TAB HANDLING
  --------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("expertActiveTab") || "about"
  );

  useEffect(() => {
    sessionStorage.setItem("expertActiveTab", activeTab);
  }, [activeTab]);

  /* ---------- SECTION REFS ---------- */
  const userRef = useRef(null);
  const expertRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const certRef = useRef(null);
  const honorRef = useRef(null);

  const [leftActive, setLeftActive] = useState("user-details");
  const isUserScrolling = useRef(true);

  const scrollToSection = (ref, key) => {
    setLeftActive(key);
    isUserScrolling.current = false;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  /* ---------- SCROLL SPY ---------- */
  useEffect(() => {
    const NAV_HEIGHT = 60;

    const handleScroll = () => {
      if (!isUserScrolling.current) return;

      const offset = NAV_HEIGHT + 40;

      const sections = [
        { key: "user-details", el: userRef.current },
        { key: "expert-details", el: expertRef.current },
        { key: "experience", el: experienceRef.current },
        { key: "education", el: educationRef.current },
        { key: "certification", el: certRef.current },
        { key: "honors", el: honorRef.current },
      ];

      let closest = "user-details";
      let minDistance = Infinity;

      sections.forEach((sec) => {
        if (!sec.el) return;
        const rect = sec.el.getBoundingClientRect();
        const distance = Math.abs(rect.top - offset);
        if (distance < minDistance) {
          minDistance = distance;
          closest = sec.key;
        }
      });

      setLeftActive(closest);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- RESTORE SCROLL ---------- */
  useEffect(() => {
    if (postView.from === "expert-profile") {
      if (postView.tab) setActiveTab(postView.tab);
      setTimeout(() => window.scrollTo(0, postView.scroll || 0), 50);
    }
  }, [postView]);

  useEffect(() => {
    if (!disableSelfFetch) {
      axiosSecure.get("/v1/experts/me/profile/").then((res) => {
        setExpertData(res.data);
        dispatch(setActiveProfileData({ role: "expert", profile: res.data }));

        // ✅ ADD THIS LINE
        dispatch(fetchUserProfile());
      });
    }

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);



  /* ---------- SAVE USER ---------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      // ✅ update local expertData.user
      setExpertData((prev) => {
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
        dispatch(setActiveProfileData({ role: "expert", profile: updated }));
        return updated;
      });

      setEditData({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
      });

      dispatch(fetchUserProfile());

      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch {
      showAlert("Update failed!", "error");
    }
  };





  /* ---------- SAVE EXPERT ---------- */
  const handleSaveExpert = async () => {
    try {
      const res = await axiosSecure.patch("/v1/experts/me/profile/", {
        headline: expertData.headline,
        primary_expertise: expertData.primary_expertise,
        other_expertise: expertData.other_expertise,
        hourly_rate: expertData.hourly_rate,
      });

      setExpertData((prev) => ({
        ...res.data,
        user: prev.user, // ✅ DO NOT overwrite auth user
      }));

      setEditExp(false);
      showAlert("Expert profile updated!", "success");
    } catch {
      showAlert("Failed!", "error");
    }
  };


  /* ---------- PROFILE PIC ---------- */
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
        ...expertData,
        user: res.data.user,
      };
      setExpertData(updated);

      dispatch(setActiveProfileData({ role: "expert", profile: updated }));

      // ✅ Instantly update navbar profile pic
      dispatch(updateProfilePicture(res.data.user.profile_picture));

      showAlert("Profile picture updated!", "success");
    } catch {
      showAlert("Upload failed!", "error");
    }
  };

  // Delete logic moved to UserPosts component

  /* ---------- LOADING ---------- */
  if (!expertData || !user) {
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
                    src={`${resolveMedia(user.profile_picture)}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-full h-full object-cover transform md:group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-red-600 flex items-center justify-center text-5xl font-black text-white">
                    {user.username.charAt(0)}
                  </div>
                )}
              </div>

              {/* EDIT BUTTON */}
              {!readOnly && (
                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shadow-xl cursor-pointer hover:bg-red-600 transition-colors z-20">
                  <MdEdit size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* INFO */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                <div>
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-2 ${text}`}>
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      @{user?.username}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <FaGraduationCap size={14} /> Expert
                    </span>
                    {expertData.verified_by_admin && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 border border-green-500/20">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="flex-shrink-0">
                  {readOnly ? (
                    <button
                      onClick={() => navigate(`/book-session/${user.uuid}`)}
                      className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
                    >
                      <MdOutlineEventAvailable size={18} />
                      Book Slots
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate("/expert/slots")}
                      className="flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/20"
                    >
                      <MdOutlineEventAvailable size={18} />
                      Manage Slots
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
        <div className="animate-fadeIn">
          {activeTab === "about" && (
            <div className="flex flex-col lg:flex-row gap-8 relative">
              {/* SIDEBAR NAVIGATION */}
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className={`sticky top-32 p-4 rounded-3xl border transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-xl"}`}>
                  {[
                    { key: "user-details", label: "User Details", icon: <MdOutlineManageAccounts size={18} />, ref: userRef },
                    { key: "expert-details", label: "Expert Details", icon: <HiOutlineIdentification size={18} />, ref: expertRef },
                    { key: "experience", label: "Experience", icon: <MdWorkOutline size={18} />, ref: experienceRef },
                    { key: "education", label: "Education", icon: <PiBookOpenTextLight size={18} />, ref: educationRef },
                    { key: "certification", label: "Certification", icon: <PiCertificateLight size={18} />, ref: certRef },
                    { key: "honors", label: "Honors", icon: <PiMedalLight size={18} />, ref: honorRef },
                  ].map((item) => {
                    const isActive = leftActive === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => scrollToSection(item.ref, item.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all mb-1 ${isActive
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                          : "text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                          }`}
                      >
                        {item.icon} {item.label}
                      </button>
                    )
                  })}
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

                <div ref={expertRef} className="scroll-mt-32">
                  <ExpertDetails
                    expertData={expertData}
                    setExpertData={setExpertData}
                    editExp={!readOnly && editExp}
                    setEditExp={readOnly ? () => { } : setEditExp}
                    handleSaveExpert={handleSaveExpert}
                  />
                </div>

                <div ref={experienceRef} className="scroll-mt-32">
                  <ExperiencePage
                    experiences={expertData.experiences || []}
                    setExpertData={setExpertData}
                  />
                </div>

                <div ref={educationRef} className="scroll-mt-32">
                  <EducationPage
                    education={expertData.educations || []}
                    setExpertData={setExpertData}
                  />
                </div>

                <div ref={certRef} className="scroll-mt-32">
                  <CertificationPage
                    certifications={expertData.certifications || []}
                    setExpertData={setExpertData}
                  />
                </div>

                <div ref={honorRef} className="scroll-mt-32">
                  <HonorsPage
                    honors_awards={expertData.honors_awards || []}
                    setExpertData={setExpertData}
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
              src={`${resolveMedia(user.profile_picture)}?t=${Date.now()}`}
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