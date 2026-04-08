import { useState, useRef } from "react";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { HiPencilAlt, HiTrash } from "react-icons/hi";
import { savePostViewState } from "../../redux/slices/postViewSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEllipsisH } from "react-icons/fa";

import useLike from "../../components/hooks/useLike";
import CreatePostModal from "../../components/posts/create_post";
import { useConfirm } from "../../context/ConfirmContext";
import { useAlert } from "../../context/AlertContext";
import axiosSecure from "../../components/utils/axiosSecure";
import useClickOutside from "../../components/hooks/useClickOutside";

import { updatePost, addPost, setEditingPost, setCreateModalOpen, removePost } from "../../redux/slices/postsSlice";

import PostCard from "../../components/posts/PostCard";
import ModalOverlay from "../../components/ui/ModalOverlay";
import SponsorCard from "../../components/ui/SponsorCard";
import { getAccessToken } from "../../redux/store/tokenManager";

export default function UserPosts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: posts, editingPost, isCreateModalOpen: openCreate } = useSelector((state) => state.posts);
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);

  const isDark = theme === "dark";
  const profileUser = activeProfile?.profile?.user || activeProfile?.profile || {};
  const isOwnProfile = loggedUser?.username === (profileUser.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const setPosts = (callback) => {
    // This setter is needed for useLike.jsx which expects a state setter.
    // We'll simulate it by dispatching updates.
    if (typeof callback === "function") {
      const updatedPosts = callback(posts);
      // useLike only updates the specific post's like status
      const changedPost = updatedPosts.find((p, i) => p !== posts[i]);
      if (changedPost) {
        dispatch(updatePost(changedPost));
      }
    }
  };

  const handleSetOpenCreate = (val) => dispatch(setCreateModalOpen(val));
  const handleSetEditingPost = (val) => dispatch(setEditingPost(val));
  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const internalHandleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "Are you sure you want to delete this post?",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          dispatch(removePost(postId));
          showAlert("Post deleted!", "success");
        } catch (err) {
          console.log("Delete failed:", err);
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  // 🌟 Get token from TokenManager
  const token = getAccessToken();

  // 🌟 Correct useLike usage
  const { handleLike } = useLike(setPosts, token, () => {
    // setShowLogin is not defined here, but we can navigate to login
    navigate("/login");
  });

  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setMenuOpen(null));
  const [expandedPost, setExpandedPost] = useState(null);

  const cardBg = isDark ? "bg-[#2c2c2c]" : "bg-white";
  const text = isDark ? "text-[#eaeaea]" : "text-[#111111]";
  const borderColor = isDark ? "border-white/15" : "border-black/10";

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      : "";

  /* -----------------------
      OPEN COMMENTS PAGE
  ------------------------ */
  const handleOpenPost = (postId) => {
    if (!token) return navigate("/login");

    dispatch(
      savePostViewState({
        from: "normal-profile",
        tab: "posts",
        scroll: window.scrollY,
      })
    );

    navigate(`/post/${postId}/comments`);
  };

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: Posts */}
      <div className="lg:col-span-8 w-full max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Posts</h2>

          {!readOnly && (
            <button
              onClick={() => {
                if (!token) return navigate("/login");
                handleSetEditingPost(null);
                handleSetOpenCreate(true);
              }}
              className="px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Create Post
            </button>
          )}

        </div>

        {!posts || posts.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <p className="font-bold tracking-widest text-sm uppercase">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={{ ...post, author: post.author || profileUser }} // Ensure author exists
                loggedUser={loggedUser}
                isDark={isDark}
                onLike={(id) => handleLike(id)}
                onDelete={internalHandleDelete}
                onEdit={(p) => {
                  handleSetEditingPost(p);
                  handleSetOpenCreate(true);
                }}
                onCommentClick={(p) => handleOpenPost(p.id)}
                onTagClick={(tag) => navigate(`/search?q=${tag}&type=posts`)}
                onProfileClick={() => { }} // Already on profile
                showMenu={!readOnly}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Ads */}
      <aside className="hidden lg:block lg:col-span-4 space-y-8 pt-12">
        <SponsorCard isDark={isDark} />
      </aside>

      {/* POST MODAL */}
      {openCreate && (
        <ModalOverlay close={() => {
          handleSetOpenCreate(false);
          handleSetEditingPost(null);
        }}>
          <CreatePostModal
            isDark={isDark}
            post={editingPost}
            onClose={() => {
              handleSetOpenCreate(false);
              handleSetEditingPost(null);
            }}
            onSuccess={(updated) => {
              if (editingPost) {
                dispatch(updatePost(updated));
              } else {
                dispatch(addPost(updated));
              }
            }}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
