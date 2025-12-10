import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaGraduationCap } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import { clearPostViewState } from "../redux/slices/postViewSlice";

// Shared Components
import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";

// Expert Detail Components
import ExpertDetails from "./expertDetails/expertDetails";
import ExperiencePage from "./expertDetails/expertExperience";
import EducationPage from "./expertDetails/expertEducation";
import CertificationPage from "./expertDetails/expertCertification";
import HonorsPage from "./expertDetails/expertHonors";

export default function ExpertProfile({ theme }) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const posts = useSelector((state) => state.posts.items);

  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("expertActiveTab") || "about"
  );
  const [aboutTab, setAboutTab] = useState(
    sessionStorage.getItem("expertAboutTab") || "user"
  );

  const [user, setUser] = useState(null);
  const [expertData, setExpertData] = useState(null);

  // LOCAL states for UserDetails editing
  const [editUser, setEditUser] = useState(false);
  const [editExp, setEditExp] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // POST MODAL states
  const [openCreate, setOpenCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [loading, setLoading] = useState(true);

  /* ---------------- STORAGE PERSISTENCE ---------------- */
  useEffect(() => {
    sessionStorage.setItem("expertActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("expertAboutTab", aboutTab);
  }, [aboutTab]);

  /* ---------------- LOAD PROFILE + POSTS ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const userRes = await axiosSecure.get("/v1/auth/me/");
        const u = userRes.data;
        setUser(u);

        setEditData({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
        });

        const expRes = await axiosSecure.get("/v1/experts/me/profile/");
        setExpertData(expRes.data);

        dispatch(loadUserPosts(u.username));
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- UPDATE USER ---------------- */
  const handleSaveUser = async () => {
    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
      });

      setUser(res.data.user);
      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch (err) {
      console.log(err);
      showAlert("Update failed!", "error");
    }
  };

  /* ---------------- UPDATE EXPERT PROFILE ---------------- */
  const handleSaveExpert = async () => {
    try {
      const res = await axiosSecure.patch("/v1/experts/me/profile/", {
        headline: expertData.headline,
        primary_expertise: expertData.primary_expertise,
        other_expertise: expertData.other_expertise,
        hourly_rate: expertData.hourly_rate,
      });

      setExpertData(res.data);
      setEditExp(false);
      showAlert("Expert profile updated!", "success");
    } catch (err) {
      console.log(err);
      showAlert("Failed!", "error");
    }
  };

  /* ---------------- PROFILE PICTURE UPLOAD ---------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data.user);
      showAlert("Profile picture updated!", "success");
    } catch {
      showAlert("Upload failed!", "error");
    }
  };

  /* ---------------- DELETE POST ---------------- */

  const handleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "Are you sure you want to delete this post? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",

      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          dispatch(removePost(postId)); // remove from redux
          showAlert("Post deleted successfully!", "success");
        } catch (err) {
          console.log(err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };


  useEffect(() => {
    if (postView.from === "expert-profile") {
      if (postView.tab) {
        setActiveTab(postView.tab);
      }

      setTimeout(() => {
        window.scrollTo(0, postView.scroll || 0);
      }, 50);
    }
  }, [postView]);



  /* ---------------- LOADING ---------------- */
  if (loading || !user || !expertData) {
    return (
      <div className={`mt-20 text-center ${isDark ? "text-white" : "text-black"}`}>
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-20 px-4 ${isDark ? "bg-neutral-950 text-white" : "bg-neutral-100 text-black"
        }`}
    >
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div
          className={`p-6 rounded-xl shadow flex gap-6 items-center mb-6 ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
            }`}
        >
          <div className="relative w-28 h-28">
            {user.profile_picture ? (
              <img
                src={`${user.profile_picture}?t=${Date.now()}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 bg-red-600 text-white rounded-full flex items-center justify-center text-5xl font-bold">
                {user.username.charAt(0)}
              </div>
            )}

            <label className="absolute bottom-1 right-1 bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-black">
              <CiEdit />
              <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
            </label>
          </div>

          <div >
            <h1 className="text-3xl font-bold">
              {user.first_name || user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </h1>
            <p className="text-neutral-400 mt-2 mb-2"><span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
    border transition-all

    border-blue-400 bg-blue-400/10 text-blue-500
    dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300">@{user.username}</span> &nbsp;— &nbsp; <span
                className="
    inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
    border transition-all

    border-purple-400 bg-purple-400/10 text-purple-500
    dark:border-purple-500 dark:bg-purple-500/20 dark:text-purple-300
  "
              >
                <FaGraduationCap />&nbsp;Expert
              </span>

            </p>

            {expertData.verified_by_admin && (
              <div className="mt-1 text-green-500 text-sm font-semibold">
                Verified Expert
              </div>
            )}
          </div>
        </div>

        {/* TOP TABS */}
        <div className="flex justify-center gap-10 border-b pb-2">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-2 text-lg font-medium ${activeTab === "about"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-neutral-500"
              }`}
          >
            About
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 text-lg font-medium ${activeTab === "posts"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-neutral-500"
              }`}
          >
            Posts
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="mt-6">

          {/* -------------- ABOUT SECTION -------------- */}
          {activeTab === "about" && (
            <div className="flex gap-6">

              {/* LEFT-SIDE TABS */}
              <div
                className={`w-1/4 sticky top-24 h-[80vh] p-4 rounded-xl shadow overflow-y-auto ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
                  }`}
              >
                {["user", "expert", "experience", "education", "certification", "honors"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAboutTab(tab)}
                    className={`block w-full text-left py-2 px-2 rounded ${aboutTab === tab
                      ? "text-red-500 font-semibold"
                      : "text-neutral-500"
                      }`}
                  >
                    {tab === "user" && "User Details"}
                    {tab === "expert" && "Expert Details"}
                    {tab === "experience" && "Experience"}
                    {tab === "education" && "Education"}
                    {tab === "certification" && "Certification"}
                    {tab === "honors" && "Honors & Awards"}
                  </button>
                ))}
              </div>

              {/* RIGHT-SIDE CONTENT */}
              <div className="w-3/4 min-w-0">
                {aboutTab === "user" && (
                  <UserDetails
                    user={user}
                    editMode={editUser}
                    setEditMode={setEditUser}
                    editData={editData}
                    setEditData={setEditData}
                    handleSave={handleSaveUser}
                    isDark={isDark}
                  />
                )}

                {aboutTab === "expert" && (
                  <ExpertDetails
                    expertData={expertData}
                    setExpertData={setExpertData}
                    editExp={editExp}
                    setEditExp={setEditExp}
                    handleSaveExpert={handleSaveExpert}
                    isDark={isDark}
                  />
                )}

                {aboutTab === "experience" && (
                  <ExperiencePage experiences={expertData.experiences || []} setExpertData={setExpertData} isDark={isDark} />
                )}

                {aboutTab === "education" && (
                  <EducationPage education={expertData.educations || []} setExpertData={setExpertData} isDark={isDark} />
                )}

                {aboutTab === "certification" && (
                  <CertificationPage certifications={expertData.certifications || []} setExpertData={setExpertData} isDark={isDark} />
                )}

                {aboutTab === "honors" && (
                  <HonorsPage honors_awards={expertData.honors_awards || []} setExpertData={setExpertData} isDark={isDark} />
                )}
              </div>
            </div>
          )}

          {/* -------------- POSTS SECTION -------------- */}
          {activeTab === "posts" && (
            <UserPosts
              posts={posts}
              isDark={isDark}
              openCreate={openCreate}
              setOpenCreate={setOpenCreate}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              handleDelete={handleDelete}
              setShowLogin={() => { }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
