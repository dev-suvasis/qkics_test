import { useState, useRef } from "react";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaEllipsisH } from "react-icons/fa";
import { HiPencilAlt, HiTrash } from "react-icons/hi";
import UserBadge from "../ui/UserBadge";
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

// HELPER: User Badge - Removed and moved to reusable component

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
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useClickOutside(menuRef, () => setMenuOpen(false));
    const [expanded, setExpanded] = useState(false);

    const text = isDark ? "text-neutral-100" : "text-neutral-900";
    const borderColor = isDark ? "border-white/5" : "border-black/5";

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
                            src={resolveAvatar(post.author.profile_picture, post.author.username)}
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
                            <div className={`absolute right-0 mt-3 w-40 rounded-xl shadow-2xl border p-1 animate-pop z-20 ${isDark ? "bg-neutral-800 border-white/10" : "bg-white border-black/5"
                                }`}>
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
                    <h2 className="text-xl font-extrabold mb-3 leading-tight tracking-tight">
                        {post.title}
                    </h2>
                )}

                <div className="relative">
                    <p className={`text-[15px] leading-relaxed opacity-80 font-medium ${!expanded && post.content.length > 200 ? "line-clamp-3" : ""}`}>
                        {post.content}
                    </p>

                    {post.content.length > 200 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-3 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                        >
                            {expanded ? "READ LESS ▲" : "READ MORE ▼"}
                        </button>
                    )}
                </div>

                {/* TAGS */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
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

                {/* IMAGE */}
                {post.image && (
                    <div className="mt-6 overflow-hidden rounded-2xl group relative cursor-zoom-in" onClick={() => onImageClick?.(post.image)}>
                        <img
                            src={post.image}
                            alt="post"
                            className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    </div>
                )}

                {/* ACTION BAR */}
                <div className="mt-8 flex items-center gap-3">
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
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border border-black/5 dark:border-white/5 hover:border-red-500/50 transition-all`}
                    >
                        <span className="text-base">💬</span>
                        <span className="text-xs font-bold text-neutral-500">{post.total_comments} Comments</span>
                    </button>

                    {/* <button className={`ml-auto h-10 w-10 flex items-center justify-center rounded-xl border border-black/5 dark:border-white/5 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all text-neutral-400`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                    </button> */}
                </div>
            </div>
        </article>
    );
}