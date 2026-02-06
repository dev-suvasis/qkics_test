// src/pages/home.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa6";
import { MdOutlineFileDownload } from "react-icons/md";
import { useSelector } from "react-redux";

import { useConfirm } from "../context/ConfirmContext";
import { useAlert } from "../context/AlertContext";
import axiosSecure from "../components/utils/axiosSecure";
import useFeed from "../components/hooks/useFeed";
import useLike from "../components/hooks/useLike";
import useTags from "../components/hooks/useTags";
import { getAccessToken } from "../redux/store/tokenManager";

import CreatePostModal from "../components/posts/create_post";
import LoginModal from "../components/auth/login";
import SignupModal from "../components/auth/signup";
import ModalOverlay from "../components/ui/ModalOverlay";
import PostCard from "../components/posts/PostCard";

function Home() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";

  const { showConfirm } = useConfirm();
  const { showAlert } = useAlert();

  // THEME COLORS (Now using CSS variables from index.css)
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]";
  const text = isDark ? "text-neutral-100" : "text-neutral-900";
  const borderColor = isDark ? "border-white/5" : "border-black/5";

  // LOCAL STATES
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);

  // HOOKS
  const { posts, setPosts, loaderRef, next } = useFeed(null, searchQuery);

  const { handleLike } = useLike(
    setPosts,
    () => getAccessToken(),
    () => setShowLogin(true)
  );

  const { tags, loading: loadingTags } = useTags();

  // Restore scroll position
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("scrollY");
    if (savedScroll && posts.length > 0) {
      setTimeout(() => window.scrollTo(0, Number(savedScroll)), 50);
      sessionStorage.removeItem("scrollY");
    }
  }, [posts]);

  const goToProfile = (author) => {
    if (!loggedUser) {
      navigate(`/profile/${author.username}`);
      return;
    }

    if (loggedUser.username === author.username) {
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
    navigate(`/profile/${author.username}`);
  };

  const handleDelete = (postId) => {
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

  const applySearch = (value) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}&type=posts`);
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete("search");
      setSearchParams(params);
    }
  };

  if (loggedUser?.user_type === "admin") return <Navigate to="/admin" />;
  if (loggedUser?.user_type === "superadmin") return <Navigate to="/superadmin" />;

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = url.split("/").pop() || "image.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className={`min-h-screen ${bg} md:pb-10`}>
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-12 gap-8">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-6">
            {/* Create Post Button */}
            <button
              onClick={() => {
                if (!loggedUser) return setShowLogin(true);
                setEditingPost(null);
                setShowCreatePost(true);
              }}
              className="w-full group flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-600 text-white font-bold shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                <FaPlus size={18} />
              </span>
              <span className="text-sm tracking-wide uppercase">New Discovery</span>
            </button>

            {/* Tags Card */}
            <div className={`premium-card p-6 ${isDark ? "bg-neutral-900" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Top Categories</h3>
                {searchQuery && (
                  <button onClick={() => applySearch("")} className="text-[10px] text-red-500 font-bold hover:underline">RESET</button>
                )}
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                {loadingTags ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-xl bg-neutral-800/50" />)}
                  </div>
                ) : (
                  <>
                    {(showAllTags ? tags : tags.slice(0, 8)).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => applySearch(tag.name)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all group border ${searchQuery === tag.name
                          ? "bg-red-500/10 border-red-500/50 text-red-500"
                          : "border-transparent hover:bg-neutral-800 hover:text-white"
                          }`}
                      >
                        <span className="opacity-50 group-hover:opacity-100 transition-opacity mr-2">#</span>
                        {tag.name}
                      </button>
                    ))}

                    {tags.length > 8 && (
                      <button
                        onClick={() => setShowAllTags(!showAllTags)}
                        className="w-full py-3 mt-4 text-xs font-bold text-center border border-dashed border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
                      >
                        {showAllTags ? "SHOW LESS" : "EXPLORE ALL"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="col-span-12 lg:col-span-6 space-y-6">
          {/* MOBILE TAGS */}
          <div className="lg:hidden relative group mb-2">
            <div className="overflow-x-auto pb-4 flex gap-3 no-scrollbar pr-14">
              {loadingTags ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-24 h-8 rounded-full bg-neutral-800/50 animate-pulse" />)}
                </div>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => applySearch(tag.name)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full border text-xs font-bold transition-all shrink-0 ${searchQuery === tag.name
                      ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                      : `${isDark ? "bg-neutral-900 border-white/5" : "bg-white border-black/5"} opacity-80`
                      }`}
                  >
                    #{tag.name}
                  </button>
                ))
              )}
            </div>
            {searchQuery && (
              <div className="absolute right-0 top-0 bottom-4 z-10 flex items-center pl-6 bg-gradient-to-l from-[#0a0a0a]">
                <button onClick={() => applySearch("")} className="bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl">CLEAR</button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                loggedUser={loggedUser}
                isDark={isDark}
                onLike={handleLike}
                onDelete={handleDelete}
                onEdit={(p) => { setEditingPost(p); setShowCreatePost(true); }}
                onCommentClick={(p) => {
                  if (!loggedUser) return setShowLogin(true);
                  sessionStorage.setItem("scrollY", window.scrollY);
                  navigate(`/post/${p.id}/comments`);
                }}
                onTagClick={applySearch}
                onImageClick={setPreviewImage}
                onProfileClick={goToProfile}
              />
            ))}
          </div>

          <div ref={loaderRef} className="py-20 flex flex-col items-center justify-center opacity-30 gap-4">
            {posts.length === 0 ? (
              <p className="font-bold tracking-widest text-sm">NO DISCOVERIES YET</p>
            ) : next ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-red-500 border-white/10" />
            ) : (
              <p className="font-bold tracking-widest text-sm uppercase">End of Exploration</p>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-8">
            <AdCard isDark={isDark} />
            <AdCard isDark={isDark} featured />

            <footer className="px-6 text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] space-y-2">
              <div className="flex gap-4">
                <a href="#" className="hover:text-red-500 transition-colors">Privacy</a>
                <a href="#" className="hover:text-red-500 transition-colors">Terms</a>
                <a href="#" className="hover:text-red-500 transition-colors">Safety</a>
              </div>
              <p>© 2026 QKICS GLOBAL</p>
            </footer>
          </div>
        </aside>
      </div>

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

      {showLogin && (
        <ModalOverlay close={() => setShowLogin(false)}>
          <LoginModal isDark={isDark} onClose={() => setShowLogin(false)} openSignup={() => { setShowLogin(false); setShowSignup(true); }} />
        </ModalOverlay>
      )}

      {showSignup && (
        <ModalOverlay close={() => setShowSignup(false)}>
          <SignupModal isDark={isDark} onClose={() => setShowSignup(false)} openLogin={() => { setShowSignup(false); setShowLogin(true); }} />
        </ModalOverlay>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fadeIn" onClick={() => { setPreviewImage(null); setZoom(1); }}>
          <div className="relative max-w-[95vw] max-h-[95vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex gap-4">
              <button onClick={() => downloadImage(previewImage)} className="bg-white/10 text-white rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-red-500 transition-all font-bold text-xs"><MdOutlineFileDownload size={18} /> SAVE</button>
              <button onClick={() => { setPreviewImage(null); setZoom(1); }} className="bg-white/10 text-white rounded-xl px-4 py-2 hover:bg-neutral-800 transition-all font-bold text-xs">CLOSE</button>
            </div>
            <img src={previewImage} alt="Preview" className="rounded-2xl shadow-2xl max-w-full max-h-[85vh] object-contain transition-transform duration-300" style={{ transform: `scale(${zoom})` }} onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))} />
          </div>
        </div>
      )}

      <button onClick={() => { if (!loggedUser) return setShowLogin(true); setEditingPost(null); setShowCreatePost(true); }} className="lg:hidden fixed bottom-24 right-6 z-40 bg-red-600 text-white h-14 w-14 rounded-2xl shadow-2xl shadow-red-600/30 flex items-center justify-center text-xl hover:bg-red-700 active:scale-90 transition-all">
        <FaPlus />
      </button>
    </div>
  );
}

function AdCard({ isDark, featured }) {
  return (
    <div className={`premium-card overflow-hidden group ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Featured Partner</p>
        </div>
        <div className="relative overflow-hidden rounded-xl mb-6">
          <img src="https://skcinfotech.in/images/banner/ban1.png" alt="ads" className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <h4 className="font-bold text-lg leading-tight mb-2">Grow your business with PayPal Vision</h4>
        <p className="opacity-60 text-sm mb-6 leading-relaxed">Unlock global payments and secure transactions with our next-gen API integration.</p>
        <button className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all ${isDark ? "bg-white/5 text-white" : "bg-neutral-100 text-black"}`}>Learn More</button>
      </div>
    </div>
  );
}

export default Home;
