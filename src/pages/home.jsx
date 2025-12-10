import { useState, useEffect } from "react";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";
import { HiPencilAlt, HiTrash } from "react-icons/hi";
import { FaGraduationCap, FaUser } from "react-icons/fa";
import { IoIosRocket } from "react-icons/io";



import { useConfirm } from "../context/ConfirmContext";
import { useAlert } from "../context/AlertContext";

import axiosSecure from "../components/utils/axiosSecure";

import useFeed from "../components/hooks/useFeed";
import useLike from "../components/hooks/useLike";
import useTags from "../components/hooks/useTags";

import CreatePostModal from "../components/posts/create_post";
import LoginModal from "../components/auth/Login";
import SignupModal from "../components/auth/Signup";

import { useSelector } from "react-redux";
import { getAccessToken } from "../redux/store/tokenManager";

function Home({ theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || ""; // URL → the only source

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  const loggedUser = useSelector((state) => state.user.data);

  // THEME COLORS
  const bg = isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]";
  const cardBg = isDark ? "bg-[#2c2c2c]" : "bg-white";
  const hoverBg = isDark ? "hover:bg-[#3a3a3a]" : "hover:bg-[#f0f0f0]";
  const text = isDark ? "text-[#eaeaea]" : "text-[#111111]";
  const borderColor = isDark ? "border-white/15" : "border-black/10";

  // LOCAL STATES
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const [showAllTags, setShowAllTags] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);

  const accessToken = getAccessToken();

  // HOOKS
  const { posts, setPosts, loaderRef } = useFeed(null, searchQuery);

  const { handleLike } = useLike(
    setPosts,
    () => getAccessToken(),
    () => setShowLogin(true)
  );

  const { tags, loading: loadingTags } = useTags();

  // Restore scroll position (for comments page navigation)
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("scrollY");
    if (savedScroll && posts.length > 0) {
      setTimeout(() => window.scrollTo(0, Number(savedScroll)), 50);
      sessionStorage.removeItem("scrollY");
    }
  }, [posts]);

  // TIME AGO
  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (let unit in intervals) {
      const val = Math.floor(seconds / intervals[unit]);
      if (val >= 1) return `${val} ${unit}${val > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };

  // DELETE POST
  const handleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "Are you sure you want to delete this post?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const res = await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          if (res.status === 204) {
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            showAlert("Post deleted successfully!", "success");
          }
        } catch {
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  // ------------------------------
  // TAG CLICK → SEARCH REDIRECT
  // ------------------------------
  const applySearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set("search", value.trim());
    else params.delete("search");

    setSearchParams(params);
  };

  function getUserBadge(user_type, isDark) {
  switch (user_type) {
    case "expert":
      return (
        <span
          className="
            inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
            border transition-all
            border-purple-400 bg-purple-400/10 text-purple-500
            dark:border-purple-500 dark:bg-purple-500/20 dark:text-purple-300
          "
        >
          <FaGraduationCap className="mr-1" /> Expert
        </span>
      );

    case "entrepreneur":
      return (
        <span
          className="
            inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
            border transition-all
            border-orange-400 bg-orange-400/10 text-orange-500
            dark:border-orange-500 dark:bg-orange-500/20 dark:text-orange-300
          "
        >
          <IoIosRocket className="mr-1" /> Entrepreneur
        </span>
      );

    default:
      // Normal user
      return (
        <span
          className="
            inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
            border transition-all
            border-gray-400 bg-gray-400/10 text-gray-500
            dark:border-gray-500 dark:bg-gray-500/20 dark:text-gray-300
          "
        >
          <FaUser className="mr-1" /> Normal
        </span>
      );
  }
}

  return (
    <div className={`min-h-screen mt-3 ${bg}`}>
      <div className="pt-14 max-w-6xl mx-auto px-4 pb-10 grid grid-cols-12 gap-4">

        {/* LEFT SIDEBAR */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2">
          <div className={`sticky top-16 space-y-3 text-sm ${text}`}>

            {/* CREATE POST */}
            <button
              onClick={() => {
                if (!loggedUser) return setShowLogin(true);
                setEditingPost(null);
                setShowCreatePost(true);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl ${cardBg} ${hoverBg} border ${borderColor}`}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                <FaPlus />
              </span>
              <span className="font-semibold">Create Post</span>
            </button>

            {/* TAG LIST */}
            <div className="mt-6 space-y-1">
              <div className="px-4 flex items-center justify-between mb-2">
                <p className={`text-xs font-bold uppercase tracking-wider ${text}/60`}>
                  Tags
                </p>

                {searchQuery && (
                  <button
                    onClick={() => applySearch("")}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div
                className="max-h-[500px] overflow-y-scroll pr-2"
                style={{ scrollbarWidth: "thin" }}
              >
                {loadingTags ? (
                  <p className="px-4 py-2 text-xs opacity-70">Loading...</p>
                ) : (
                  <>
                    {Array.isArray(tags) &&
                      (showAllTags ? tags : tags.slice(0, 8)).map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => applySearch(tag.slug)} // 🔥 tag to search
                          className={`w-full text-left px-4 py-2 mb-2 rounded-xl border ${borderColor} ${hoverBg}
                            ${searchQuery === tag.slug ? "border-red-500 bg-red-500/10 font-semibold" : ""}
                          `}
                        >
                          {tag.name}
                        </button>
                      ))}

                    {Array.isArray(tags) && tags.length > 8 && (
                      <button
                        onClick={() => setShowAllTags(!showAllTags)}
                        className={`w-full px-4 py-2 mt-2 text-sm text-blue-500 ${hoverBg} rounded-xl border ${borderColor}`}
                      >
                        {showAllTags ? "Show Less ▲" : "Show More ▼"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="col-span-12 md:col-span-6 lg:col-span-7 space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`rounded-2xl overflow-hidden border ${borderColor} ${cardBg} shadow-sm hover:shadow-lg transition-shadow`}
            >

              {/* HEADER */}
              <header className="p-5 flex items-start gap-4 relative">
                <div className="h-11 w-11 rounded-full overflow-hidden cursor-pointer">
                  <img
                    src={
                      post.author.profile_picture
                        ? `${post.author.profile_picture}?t=${Date.now()}`
                        : `https://ui-avatars.com/api/?name=${post.author.username}&background=random&length=1`
                    }
                    className="rounded-full object-cover h-full w-full"
                    onClick={() => navigate(`/u/${post.author.username}`)}
                  />
                </div>

                <div className="flex flex-col">

  {/* NAME + BADGE ROW */}
  <div className="flex items-center gap-2">
    <span
      className={`font-semibold cursor-pointer hover:underline ${text}`}
      onClick={() => navigate(`/u/${post.author.username}`)}
    >
      {(post.author.first_name || post.author.last_name)
        ? `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim()
        : post.author.username}
    </span>

    {/* USER BADGE */}
    {getUserBadge(post.author.user_type, isDark)}
  </div>

  {/* TIME AGO */}
  <span className="text-xs opacity-60">{timeAgo(post.created_at)}</span>
</div>



                {/* MENU */}
                {loggedUser && loggedUser.id === post.author.id && (
                  <div className="ml-auto relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === post.id ? null : post.id)
                      }
                      className="p-2 rounded-full hover:bg-gray-200/20"
                    >
                      ⋮
                    </button>

                    {menuOpen === post.id && (
                      <div
                        className={`absolute right-0 mt-2 w-32 rounded-xl shadow-lg border ${cardBg} p-1 z-20`}
                      >
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setShowCreatePost(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200/20 flex items-center gap-2"
                        >
                          <HiPencilAlt /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-200/20 text-red-500 flex items-center gap-2"
                        >
                          <HiTrash /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </header>

              {/* CONTENT */}
              <div className={`px-6 pb-6 leading-relaxed ${text}`}>
                {/* TITLE */}
                {post.title && (
                  <h2 className="text-lg font-bold">
                    {post.title.length > 60
                      ? post.title.slice(0, 60) + "…"
                      : post.title}
                  </h2>
                )}

                {/* CONTENT */}
                <p>
                  {expandedPost === post.id
                    ? post.content
                    : post.content.length > 200
                    ? post.content.slice(0, 200) + "…"
                    : post.content}
                </p>

                {post.content.length > 200 && (
                  <button
                    onClick={() =>
                      setExpandedPost(
                        expandedPost === post.id ? null : post.id
                      )
                    }
                    className="mt-2 text-sm text-blue-500 hover:underline"
                  >
                    {expandedPost === post.id ? "See less" : "See more"}
                  </button>
                )}

                {/* TAGS */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        onClick={() => applySearch(tag.slug)} // 🔥 tag → search
                        className={`px-3 py-1 text-xs cursor-pointer rounded-full border 
                          ${
                            isDark
                              ? "bg-blue-900/30 text-blue-300 border-blue-800"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                          } hover:bg-blue-200/40`}
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* IMAGE */}
                {post.image && (
                  <div className="mt-4">
                    <img
                      src={post.image}
                      alt="post"
                      className="w-full rounded-xl max-h-96 object-contain shadow-sm"
                    />
                  </div>
                )}

                {/* ACTION BAR */}
                <div className="mt-5 flex items-center gap-5 text-sm">

                  {/* LIKE */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${borderColor} ${hoverBg}`}
                  >
                    {post.is_liked ? (
                      <BiSolidLike
                        key={`liked-${post.id}-${post.total_likes}`}
                        className="text-blue-500"
                      />
                    ) : (
                      <BiLike key={`unliked-${post.id}-${post.total_likes}`} />
                    )}

                    <span>{post.total_likes}</span>
                  </button>

                  {/* COMMENTS */}
                  <button
                    onClick={() => {
                      if (!loggedUser) return setShowLogin(true);
                      sessionStorage.setItem("scrollY", window.scrollY);
                      navigate(`/post/${post.id}/comments`);
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${borderColor} ${hoverBg}`}
                  >
                    💬 {post.total_comments}
                  </button>
                </div>
              </div>
            </article>
          ))}

          <div ref={loaderRef} className="h-10 flex justify-center items-center opacity-50">
            <p>Loading...</p>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <AdCard cardBg={cardBg} borderColor={borderColor} text={text} />
          <AdCard cardBg={cardBg} borderColor={borderColor} text={text} />
        </aside>
      </div>

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <ModalOverlay close={() => { setShowCreatePost(false); setEditingPost(null); }}>
          <CreatePostModal
            isDark={isDark}
            post={editingPost}
            onClose={() => { setShowCreatePost(false); setEditingPost(null); }}
            onSuccess={(updatedPost) => {
              setPosts((prev) =>
                editingPost
                  ? prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
                  : [updatedPost, ...prev]
              );
            }}
          />
        </ModalOverlay>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <ModalOverlay close={() => setShowLogin(false)}>
          <LoginModal
            isDark={isDark}
            onClose={() => setShowLogin(false)}
            openSignup={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        </ModalOverlay>
      )}

      {/* SIGNUP MODAL */}
      {showSignup && (
        <ModalOverlay close={() => setShowSignup(false)}>
          <SignupModal
            isDark={isDark}
            onClose={() => setShowSignup(false)}
            openLogin={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

export default Home;

function ModalOverlay({ children, close }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-inner">{children}</div>
    </div>
  );
}

function AdCard({ cardBg, borderColor, text }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-md ${cardBg} border ${borderColor}`}>
      <div className={`px-5 py-3 text-xs font-bold uppercase tracking-wider ${text}/50`}>
        Advertisement (DEMO)
      </div>
      <img src="https://placehold.co/400x400" alt="" />
      <div className="p-6">
        <h4 className={`${text} font-bold`}>Grow your business with PayPal</h4>
        <p className={`${text}/70 text-sm mt-1`}>Accept payments from anywhere.</p>
        <button className="mt-4 px-5 py-2 rounded-full bg-red-500 text-white font-bold shadow-md hover:shadow-lg">
          Get Started
        </button>
      </div>
    </div>
  );
}
