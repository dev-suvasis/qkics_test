import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { MdOutlineFileDownload, MdFilterList } from "react-icons/md";
import { FaSearch, FaTimes } from "react-icons/fa";

import useSearchPosts from "../components/hooks/useSearch";
import useSearchProfiles from "../components/hooks/useSearchProfiles";
import useTags from "../components/hooks/useTags";
import useLike from "../components/hooks/useLike";
import { useConfirm } from "../context/ConfirmContext";
import { useAlert } from "../context/AlertContext";
import { getAccessToken } from "../redux/store/tokenManager";
import axiosSecure from "../components/utils/axiosSecure";

import PostCard from "../components/posts/PostCard";
import ModalOverlay from "../components/ui/ModalOverlay";
import LoginModal from "../components/auth/login";
import SignupModal from "../components/auth/signup";
import UserBadge from "../components/ui/UserBadge";
import CreatePostModal from "../components/posts/create_post";

export default function SearchResultsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme, data: loggedUser } = useSelector((state) => state.user);
    const isDark = theme === "dark";

    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "posts";

    const {
        searchPosts,
        results: postResults,
        setResults: setPostResults,
        loading: postLoading,
    } = useSearchPosts();

    const {
        searchProfiles,
        results: profileResults,
        loading: profileLoading,
    } = useSearchProfiles();

    const { tags, loading: loadingTags } = useTags();
    const { showConfirm } = useConfirm();
    const { showAlert } = useAlert();

    // LOCAL STATES
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [showAllTags, setShowAllTags] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    // HOOKS
    const { handleLike } = useLike(
        setPostResults,
        () => getAccessToken(),
        () => setShowLogin(true)
    );

    // THEME COLORS
    const bg = isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]";
    const cardBg = isDark ? "bg-[#141414]" : "bg-white";
    const text = isDark ? "text-[#eaeaea]" : "text-[#111111]";
    const mutedText = isDark ? "text-neutral-500" : "text-neutral-500";
    const borderColor = isDark ? "border-white/5" : "border-black/5";
    const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";

    /* 🔄 Fetch when query or tab changes */
    useEffect(() => {
        if (!query.trim()) return;

        if (type === "posts") {
            searchPosts(query);
        } else if (type === "profiles") {
            searchProfiles(query);
        }
    }, [query, type, searchPosts, searchProfiles]);

    const switchTab = (nextType) => {
        const next = new URLSearchParams(searchParams);
        next.set("type", nextType);
        setSearchParams(next);
    };

    const applySearch = (value) => {
        if (value.trim()) {
            navigate(`/search?q=${encodeURIComponent(value.trim())}&type=posts`);
        }
    };

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
                        setPostResults((prev) => prev.filter((p) => p.id !== postId));
                        showAlert("Post deleted successfully!", "success");
                    }
                } catch {
                    showAlert("Delete failed!", "error");
                }
            },
        });
    };

    const goBack = () => {
        navigate(-1);
    };

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
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-12 gap-8">

                {/* SIDEBAR: TAGS (Hidden on mobile) */}
                <aside className="hidden md:block md:col-span-3 lg:col-span-3">
                    <div className={`sticky top-32 p-6 rounded-3xl border ${borderColor} ${cardBg} shadow-xl`}>
                        <div className="space-y-6">

                            {/* HEADER */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
                                    <MdFilterList size={20} />
                                </div>
                                <h3 className={`font-black uppercase text-xs tracking-widest ${mutedText}`}>Filtering</h3>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {loadingTags ? (
                                    <div className="flex justify-center p-4">
                                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    <>
                                        {Array.isArray(tags) && (showAllTags ? tags : tags.slice(0, 10)).map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => applySearch(tag.name)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${query === tag.name
                                                    ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-600/20"
                                                    : `${borderColor} ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"} ${mutedText}`
                                                    }`}
                                            >
                                                <span>#{tag.name}</span>
                                            </button>
                                        ))}
                                        {Array.isArray(tags) && tags.length > 10 && (
                                            <button
                                                onClick={() => setShowAllTags(!showAllTags)}
                                                className={`w-full py-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors`}
                                            >
                                                {showAllTags ? "- Show Less" : "+ Show More"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="col-span-12 md:col-span-9 lg:col-span-6 space-y-8 animate-fadeIn">

                    {/* SEARCH RESULTS HEADER */}
                    <div className="space-y-4">
                        <button
                            onClick={goBack}
                            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${mutedText} hover:text-red-500 transition-colors mb-2 ml-1`}
                        >
                            ← Back
                        </button>
                        <h1 className={`text-3xl md:text-5xl font-black tracking-tighter ${text}`}>
                            Results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">“{query}”</span>
                        </h1>
                    </div>

                    {/* GLASS TABS */}
                    <div className="flex justify-start">
                        <div className={`inline-flex flex-wrap justify-center p-1.5 rounded-2xl border ${borderColor} ${isDark ? "bg-black/40" : "bg-white/40"} backdrop-blur-md`}>
                            {["posts", "profiles"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => switchTab(t)}
                                    className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${type === t
                                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                        : `${mutedText} hover:${text}`
                                        }`}
                                >
                                    {t === "profiles" ? "People" : t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RESULTS GRID/LIST */}
                    <div className="space-y-6">
                        {type === "posts" && (
                            <>
                                {postLoading && (
                                    <div className="space-y-6">
                                        {[1, 2].map((i) => (
                                            <div key={i} className={`h-64 rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-black/5"}`} />
                                        ))}
                                    </div>
                                )}
                                {!postLoading && postResults.length === 0 && (
                                    <div className={`text-center py-20 rounded-3xl border ${borderColor} ${cardBg}`}>
                                        <FaSearch className={`mx-auto text-4xl mb-4 ${isDark ? "text-neutral-700" : "text-neutral-200"}`} />
                                        <h3 className={`font-bold text-lg ${text}`}>No posts found</h3>
                                        <p className={`text-sm ${mutedText}`}>Try adjusting your search terms</p>
                                    </div>
                                )}
                                {!postLoading && postResults.map((post) => (
                                    <div key={post.id} className="transform transition-all duration-500 hover:-translate-y-1">
                                        <PostCard
                                            post={post}
                                            loggedUser={loggedUser}
                                            isDark={isDark}
                                            onLike={handleLike}
                                            onDelete={handleDelete}
                                            onEdit={(p) => { setEditingPost(p); setShowEditModal(true); }}
                                            onCommentClick={(p) => navigate(`/post/${p.id}/comments`)}
                                            onTagClick={applySearch}
                                            onImageClick={setPreviewImage}
                                            onProfileClick={goToProfile}
                                        />
                                    </div>
                                ))}
                            </>
                        )}

                        {type === "profiles" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profileLoading && (
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className={`h-28 rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-black/5"}`} />
                                    ))
                                )}
                                {!profileLoading && profileResults.length === 0 && (
                                    <div className={`col-span-full text-center py-20 rounded-3xl border ${borderColor} ${cardBg}`}>
                                        <FaSearch className={`mx-auto text-4xl mb-4 ${isDark ? "text-neutral-700" : "text-neutral-200"}`} />
                                        <h3 className={`font-bold text-lg ${text}`}>No people found</h3>
                                        <p className={`text-sm ${mutedText}`}>Try searching by name or username</p>
                                    </div>
                                )}
                                {!profileLoading && profileResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`group relative p-5 rounded-3xl border ${borderColor} ${cardBg} hover:shadow-2xl hover:border-red-500/30 transition-all duration-300 cursor-pointer overflow-hidden`}
                                        onClick={() => goToProfile(user)}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                        <div className="relative flex items-center gap-5">
                                            <div className="relative">
                                                <img
                                                    src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-red-500 transition-all duration-300"
                                                    alt={user.username}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className={`font-bold ${text} text-lg truncate mb-0.5`}>{user.first_name || user.username} {user.last_name || ""}</h4>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${mutedText} mb-2`}>@{user.username}</p>
                                                <UserBadge userType={user.user_type} isDark={isDark} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* AD SIDEBAR (Visible only on large screens) */}
                <aside className="hidden lg:block lg:col-span-3 space-y-6">
                    <div className={`sticky top-32 p-6 rounded-3xl border ${borderColor} ${cardBg} shadow-lg`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-red-600/30">
                            <FaSearch size={18} />
                        </div>
                        <h4 className={`font-bold text-xl ${text} mb-2`}>New here?</h4>
                        <p className={`text-xs leading-relaxed ${mutedText} mb-6`}>
                            Discover experts, investors, and opportunities that match your goals.
                        </p>
                        <button
                            onClick={() => navigate('/booking')}
                            className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-black uppercase tracking-widest hover:bg-neutral-200 dark:hover:bg-white/20 transition-all text-center"
                        >
                            Explore Network
                        </button>
                    </div>
                </aside>
            </div>

            {/* MODALS */}
            {showEditModal && (
                <ModalOverlay close={() => { setShowEditModal(false); setEditingPost(null); }}>
                    <CreatePostModal
                        isDark={isDark}
                        post={editingPost}
                        onClose={() => { setShowEditModal(false); setEditingPost(null); }}
                        onSuccess={(updatedPost) => {
                            setPostResults((prev) => prev.map((p) => p.id === updatedPost.id ? updatedPost : p));
                            setShowEditModal(false);
                            setEditingPost(null);
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
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center animate-fadeIn" onClick={() => { setPreviewImage(null); setZoom(1); }}>
                    <div className="relative max-w-[95vw] max-h-[95vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { setPreviewImage(null); setZoom(1); }} className="absolute -top-12 right-0 md:-right-12 z-20 text-white/50 hover:text-white transition-colors">
                            <FaTimes size={24} />
                        </button>
                        <button onClick={() => downloadImage(previewImage)} className="absolute -top-12 left-0 md:-left-12 z-20 text-white/50 hover:text-white transition-colors" title="Download">
                            <MdOutlineFileDownload size={24} />
                        </button>
                        <img src={previewImage} alt="Preview" className="rounded-2xl shadow-2xl max-w-full max-h-[85vh] object-contain transition-transform duration-200" style={{ transform: `scale(${zoom})` }} onDoubleClick={() => setZoom((z) => (z === 1 ? 2 : 1))} draggable={false} />
                    </div>
                </div>
            )}
        </div>
    );
}
