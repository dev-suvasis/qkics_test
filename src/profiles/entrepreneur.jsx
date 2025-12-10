// src/profiles/entrepreneur/EntrepreneurProfile.jsx

import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import axiosSecure from "../components/utils/axiosSecure";

import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { IoIosRocket } from "react-icons/io";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import { clearPostViewState } from "../redux/slices/postViewSlice";

// GLOBAL SHARED COMPONENTS
import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";

// ENTREPRENEUR-SPECIFIC
import EntrepreneurDetails from "./entrepreneurDetails/entrepreneurDetails";

export default function EntrepreneurProfile({ theme }) {
  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts.items);
  const postView = useSelector((state) => state.postView);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  // Tabs (main)
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("entrepreneurActiveTab") || "about"
  );

  // Tabs inside ABOUT
  const [aboutTab, setAboutTab] = useState(
    sessionStorage.getItem("entrepreneurAboutTab") || "user"
  );

  // Data
  const [user, setUser] = useState(null);
  const [entreData, setEntreData] = useState(null);

  const [loading, setLoading] = useState(true);

  // Edit user mode
  const [editUser, setEditUser] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Loading posts modal
  const [openCreate, setOpenCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  /* ------------ STORE TAB STATE ------------ */
  useEffect(() => {
    sessionStorage.setItem("entrepreneurActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem("entrepreneurAboutTab", aboutTab);
  }, [aboutTab]);

  /* ------------ LOAD PROFILE + POSTS ------------ */
  useEffect(() => {
    const load = async () => {
      try {
        // USER DATA
        const userRes = await axiosSecure.get("/v1/auth/me/");
        const u = userRes.data;
        setUser(u);

        setEditData({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
        });

        // ENTREPRENEUR DATA
        const entreRes = await axiosSecure.get(
          "/v1/entrepreneurs/me/profile/"
        );
        setEntreData(entreRes.data);

        // POSTS
        dispatch(loadUserPosts(u.username));
      } catch (err) {
        console.log("Load failed", err);
      }

      setLoading(false);
    };

    load();
  }, []);

  /* ------------ UPDATE USER INFO ------------ */
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
      showAlert("Failed to update user details", "error");
    }
  };

  /* ------------ PROFILE PICTURE UPLOAD ------------ */
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
    } catch (err) {
      console.log(err);
      showAlert("Upload failed", "error");
    }
  };

  /* ------------ DELETE POST ------------ */
  const handleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          dispatch(removePost(postId));
          showAlert("Post deleted!", "success");
        } catch (err) {
          console.log(err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  /* ------------ RESTORE SCROLL from postView ------------ */
  useEffect(() => {
    if (postView.from === "entrepreneur-profile") {
      if (postView.tab) setActiveTab(postView.tab);
      setTimeout(() => window.scrollTo(0, postView.scroll || 0), 50);
    }
  }, [postView]);

  /* ------------ LOADING ------------ */
  if (loading || !user || !entreData) {
    return (
      <div
        className={`mt-20 text-center ${
          isDark ? "text-white" : "text-black"
        }`}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen pt-20 px-4 ${
        isDark ? "bg-neutral-950 text-white" : "bg-neutral-100 text-black"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div
          className={`p-6 rounded-xl shadow flex gap-6 items-center mb-6 ${
            isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
          }`}
        >
          {/* PROFILE PICTURE */}
          <div className="relative w-28 h-28">
            {user.profile_picture ? (
              <img
                src={`${user.profile_picture}?t=${Date.now()}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 bg-red-500 text-white rounded-full flex items-center justify-center text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <label className="absolute bottom-1 right-1 bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-black">
              <CiEdit />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* NAME + TYPE */}
          <div>
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
            
                border-orange-400 bg-orange-400/10 text-orange-500
                dark:border-orange-500 dark:bg-orange-500/20 dark:text-orange-300
              "
                          >
                            <IoIosRocket />&nbsp;Entreprenuer
                          </span>
            
                        </p>

            {entreData.verified_by_admin && (
              <div className="mt-1 text-green-500 text-sm font-semibold">
                Verified Entrepreneur
              </div>
            )}
          </div>
        </div>

        {/* MAIN TABS */}
        <div className="flex justify-center gap-10 border-b pb-2">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-2 text-lg font-medium ${
              activeTab === "about"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-neutral-500"
            }`}
          >
            About
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 text-lg font-medium ${
              activeTab === "posts"
                ? "text-red-500 border-b-2 border-red-500"
                : "text-neutral-500"
            }`}
          >
            Posts
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="flex gap-6">
              {/* LEFT TABS */}
              <div
                className={`w-1/4 sticky top-24 h-[80vh] p-4 rounded-xl shadow overflow-y-auto ${
                  isDark
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-black"
                }`}
              >
                {[
                  ["user", "User Details"],
                  ["entrepreneur", "Entrepreneur Details"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setAboutTab(key)}
                    className={`block w-full text-left py-2 px-2 rounded ${
                      aboutTab === key
                        ? "text-red-500 font-semibold"
                        : "text-neutral-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* RIGHT CONTENT */}
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

                {aboutTab === "entrepreneur" && (
                  <EntrepreneurDetails
                    entreData={entreData}
                    setEntreData={setEntreData}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>
          )}

          {/* POSTS TAB */}
          {activeTab === "posts" && (
            <UserPosts
              posts={posts}
              isDark={isDark}
              openCreate={openCreate}
              setOpenCreate={setOpenCreate}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              handleDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
