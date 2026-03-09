import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaEllipsisH, FaChevronLeft, FaChevronRight, FaCrown } from "react-icons/fa";
import { HiPencilAlt, HiTrash } from "react-icons/hi";
import UserBadge from "../ui/UserBadge";
import { useAlert } from "../../context/AlertContext";
import useClickOutside from "../hooks/useClickOutside";
import { resolveAvatar } from "../utils/mediaUrl";

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
        if (val >= 1) return `${val}${unit[0]}`;
    }
    return "now";
};

export default function PostCard({
    post,
    loggedUser,
    isDark,
    onLike,
    onDelete,
    onEdit,
    onCommentClick,
    onTagClick,
    onImageClick,
    onProfileClick,
}) {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const picVersion = useSelector((state) => state.user.picVersion || 0);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useClickOutside(menuRef, () => setMenuOpen(false));
    const [expanded, setExpanded] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const text = isDark ? "text-neutral-100" : "text-neutral-900";
    const borderColor = isDark ? "border-white/5" : "border-black/5";

    const isLocked = post.is_locked === true;
    const fullContent = post.content || "";
    const previewLength = post.preview_length || 500;

    const isLongContent = !isLocked && fullContent.length > previewLength;

    // What text to actually display
    const displayText = isLocked
        ? fullContent
        : (expanded ? fullContent : (isLongContent ? fullContent.slice(0, previewLength) + "" : fullContent));

    // Gated message triggers if locked and expanded
    const isGated = expanded && isLocked;
    const isOwnPost = loggedUser && loggedUser.id === post.author.id;

    return (
        <article className={`premium-card overflow-hidden ${isDark ? "bg-neutral-900" : "bg-white"} animate-fadeIn`}>
            {/* HEADER */}
            <header className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="h-12 w-12 rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-red-500/30 transition-all"
                        onClick={() => onProfileClick?.(post.author)}
                    >
                        <img
                            src={(() => {
                                const pic = isOwnPost
                                    ? loggedUser.profile_picture
                                    : post.author.profile_picture;
                                const base = resolveAvatar(pic, post.author.username);
                                return pic ? `${base}?v=${picVersion}` : base;
                            })()}
                            className="h-full w-full object-cover"
                            alt="profile"
                            loading="lazy"
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span
                                className={`font-bold text-sm cursor-pointer hover:text-red-500 transition-colors ${text}`}
                                onClick={() => onProfileClick?.(post.author)}
                            >
                                {post.author.first_name || post.author.last_name
                                    ? `${post.author.first_name || ""} ${post.author.last_name || ""}`.trim()
                                    : post.author.username}
                            </span>
                            <UserBadge userType={post.author.user_type} isDark={isDark} />
                            {post.author.is_subscribed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/10 shadow-sm shadow-amber-500/5">
                                    <FaCrown size={10} className="text-amber-600" /> Premium
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 opacity-40 text-[10px] font-bold uppercase tracking-wider">
                            <span>{timeAgo(post.created_at)}</span>
                            <span>•</span>
                            <span>Public Discovery</span>
                        </div>
                    </div>
                </div>

                {/* MENU */}
                {loggedUser && loggedUser.id === post.author.id && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-neutral-100/50 dark:bg-white/5 hover:bg-red-500 hover:text-white transition-all"
                        >
                            <FaEllipsisH size={14} />
                        </button>

                        {menuOpen && (
                            <div className={`absolute right-0 mt-3 w-40 rounded-xl shadow-2xl border p-1 animate-pop z-20 ${isDark ? "bg-neutral-800 border-white/10" : "bg-white border-black/5"}`}>
                                <button
                                    onClick={() => { setMenuOpen(false); onEdit?.(post); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm font-medium transition-colors"
                                >
                                    <HiPencilAlt size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); onDelete?.(post.id); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 text-sm font-medium transition-colors"
                                >
                                    <HiTrash size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* CONTENT */}
            <div className={`px-6 pb-6 ${text}`}>
                {post.title && (
                    <h2 className="text-lg font-bold mb-1 leading-tight tracking-tight">
                        {post.title}
                    </h2>
                )}

                <div className="relative">
                    <p className="text-sm leading-relaxed opacity-80 font-medium whitespace-pre-wrap">
                        {displayText}
                    </p>

                    {/* READ MORE — show when there's more content and not yet expanded */}
                    {(isLocked || isLongContent) && !expanded && (
                        <div className="mt-2 text-sm">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocked) {
                                        showAlert("Please subscribe to see the full content", "warning");
                                    }
                                    setExpanded(true);
                                }}
                                className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                            >
                                READ MORE ▼
                            </button>
                        </div>
                    )}

                    {/* READ LESS — only when fully expanded and NOT locked */}
                    {isLongContent && expanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(false);
                            }}
                            className="mt-3 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors block"
                        >
                            READ LESS ▲
                        </button>
                    )}

                    {/* GATED — expanded but not subscribed */}
                    {isGated && (
                        <div className={`mt-3 p-4 rounded-xl border animate-fadeIn ${isDark ? "bg-red-600/10 border-red-600/20" : "bg-red-50 border-red-100"}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] text-white font-black">
                                    $
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                    Subscription Required
                                </p>
                            </div>
                            <p className="text-xs opacity-70 mb-4 leading-relaxed">
                                You've reached the free reading limit. Please subscribe to a Premium Plan to unlock the full intelligence of this discovery.
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/subscription");
                                }}
                                className="w-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all hover:-translate-y-0.5"
                            >
                                Subscribe to Unlock
                            </button>
                        </div>
                    )}
                </div>

                {/* TAGS */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag.id}
                                onClick={() => onTagClick?.(tag.name)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider cursor-pointer rounded-full border transition-all 
                                    ${isDark
                                        ? "bg-white/5 border-white/5 text-neutral-400 hover:border-red-500 hover:text-red-500"
                                        : "bg-neutral-100 border-black/5 text-neutral-600 hover:border-red-500 hover:text-red-500"
                                    }`}
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* MEDIA */}
                {post.media && post.media.length > 0 ? (
                    <div className="relative mt-3 overflow-hidden rounded-2xl group bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center min-h-[300px] max-h-[500px]">
                        {/* Page Indicator Top Right */}
                        {post.media.length > 1 && (
                            <div className="absolute top-4 right-4 z-30 bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md">
                                {currentMediaIndex + 1} / {post.media.length}
                            </div>
                        )}

                        <div
                            className="w-full h-full relative flex items-center justify-center cursor-pointer"
                            onClick={() => post.media[currentMediaIndex].media_type === "image" ? onImageClick?.(post.media[currentMediaIndex].file) : null}
                        >
                            {/* Blurred Background */}
                            {post.media[currentMediaIndex].media_type === "image" && (
                                <div
                                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                                    style={{ backgroundImage: `url(${post.media[currentMediaIndex].file})` }}
                                />
                            )}

                            {post.media[currentMediaIndex].media_type === "video" ? (
                                <video
                                    src={post.media[currentMediaIndex].file}
                                    controls
                                    className="relative z-10 w-full h-full block max-h-[500px] object-contain bg-black"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <img
                                    src={post.media[currentMediaIndex].file}
                                    alt={`post media ${currentMediaIndex}`}
                                    className="relative z-10 w-full h-full block transition-transform duration-700 max-h-[500px] object-contain"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {post.media.length > 1 && (
                            <>
                                {currentMediaIndex > 0 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev - 1); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center bg-white/80 dark:bg-black/50 text-black dark:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black shadow-lg"
                                    >
                                        <FaChevronLeft size={14} />
                                    </button>
                                )}
                                {currentMediaIndex < post.media.length - 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev + 1); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center bg-white/80 dark:bg-black/50 text-black dark:text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black shadow-lg"
                                    >
                                        <FaChevronRight size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ) : post.image && (
                    <div
                        className="mt-3 overflow-hidden rounded-2xl group relative cursor-zoom-in bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
                        onClick={() => onImageClick?.(post.image)}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110"
                            style={{ backgroundImage: `url(${post.image})` }}
                        />
                        <img
                            src={post.image}
                            alt="post"
                            className="relative z-10 w-full max-h-[500px] object-contain block transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* ACTION BAR */}
                <div className="mt-3 flex items-center gap-3">
                    <button
                        onClick={() => onLike?.(post.id)}
                        className={`group flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${post.is_liked
                            ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20"
                            : `border-black/5 dark:border-white/5 hover:border-red-500/50`
                            }`}
                    >
                        {post.is_liked ? <BiSolidLike size={18} /> : <BiLike size={18} className="group-hover:text-red-500 transition-colors" />}
                        <span className="text-xs font-bold">{post.total_likes}</span>
                    </button>

                    <button
                        onClick={() => onCommentClick?.(post)}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-black/5 dark:border-white/5 hover:border-red-500/50 transition-all"
                    >
                        <span className="text-base">💬</span>
                        <span className="text-xs font-bold text-neutral-500">{post.total_comments} Comments</span>
                    </button>
                </div>
            </div>
        </article>
    );
}