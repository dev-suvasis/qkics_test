import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaBuilding } from "react-icons/fa";
import { HiTrash, HiPencilAlt, HiDotsHorizontal } from "react-icons/hi";
import { resolveMedia } from "../../../components/utils/mediaUrl";
import useClickOutside from "../../../components/hooks/useClickOutside";

const timeAgo = (dateString) => {
    if (!dateString) return "";
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
        if (val >= 1) return `${val} ${unit}${val > 1 ? 's' : ''} ago`;
    }
    return "just now";
};

export default function CompanyPostCard({ post, isDark, onDelete, onEdit, isOwner }) {
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef(null);

    useClickOutside(optionsRef, () => setShowOptions(false));

    const text = isDark ? "text-neutral-100" : "text-neutral-900";
    
    // Safety check for media
    const media = post.media || (post.image ? [{ file: post.image, media_type: "image" }] : []);

    return (
        <article className={`overflow-hidden rounded-3xl border ${isDark ? "bg-neutral-900 border-white/5" : "bg-white border-black/5"} shadow-xl shadow-black/5 animate-fadeIn`}>
            <header className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link 
                        to={`/company/${post.company?.slug}`}
                        className="h-10 w-10 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-black/5 dark:border-white/5 hover:scale-105 transition-transform"
                    >
                        {post.company?.logo ? (
                            <img src={resolveMedia(post.company.logo)} alt="Company Logo" className="w-full h-full object-cover" />
                        ) : (
                            <FaBuilding className="text-red-600" size={20} />
                        )}
                    </Link>
                    <div>
                        <Link 
                            to={`/company/${post.company?.slug}`}
                            className={`text-xs font-black uppercase tracking-widest hover:text-red-600 transition-colors ${text}`}
                        >
                            {post.company?.name || "Organisation Insight"}
                        </Link>
                        <p className="text-[10px] font-bold opacity-40 tracking-tighter">{timeAgo(post.created_at)}</p>
                    </div>
                </div>

                {isOwner && (
                    <div className="relative" ref={optionsRef}>
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                                showOptions 
                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                                    : isDark ? "hover:bg-white/5 text-neutral-400" : "hover:bg-black/5 text-neutral-500"
                            }`}
                        >
                            <HiDotsHorizontal size={18} />
                        </button>

                        {showOptions && (
                            <div className={`absolute right-0 mt-2 w-40 rounded-2xl shadow-2xl border p-1.5 z-40 animate-pop origin-top-right ${
                                isDark ? "bg-[#111] border-neutral-800 shadow-black/80" : "bg-white border-black/5 shadow-xl"
                            }`}>
                                <button
                                    onClick={() => {
                                        onEdit?.(post);
                                        setShowOptions(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        isDark ? "text-neutral-300 hover:bg-white/5 hover:text-white" : "text-neutral-600 hover:bg-black/5 hover:text-black"
                                    }`}
                                >
                                    <HiPencilAlt size={16} className="text-red-500" />
                                    Edit Post
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete?.(post.id);
                                        setShowOptions(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
                                    }`}
                                >
                                    <HiTrash size={16} />
                                    Delete Post
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Content Section */}
            <div className="px-5 pb-5">
                {post.title && (
                    <h2 className={`text-xl font-black tracking-tighter mb-2 leading-tight ${text}`}>
                        {post.title}
                    </h2>
                )}
                
                <p className={`text-sm leading-relaxed opacity-80 font-medium whitespace-pre-wrap ${text}`}>
                    {post.content}
                </p>

                {/* Media Gallery */}
                {media.length > 0 && (
                    <div className="relative mt-4 overflow-hidden rounded-2xl group bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center min-h-[250px] max-h-[500px]">
                        {media.length > 1 && (
                            <div className="absolute top-4 right-4 z-30 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-md">
                                {currentMediaIndex + 1} / {media.length}
                            </div>
                        )}

                        <div className="w-full h-full relative flex items-center justify-center">
                            {media[currentMediaIndex].media_type === "video" ? (
                                <video
                                    src={media[currentMediaIndex].file}
                                    controls
                                    className="relative z-10 w-full h-full block max-h-[500px] object-contain bg-black"
                                />
                            ) : (
                                <img
                                    src={media[currentMediaIndex].file}
                                    alt="Post visual"
                                    className="relative z-10 w-full h-full block max-h-[500px] object-contain"
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {media.length > 1 && (
                            <>
                                {currentMediaIndex > 0 && (
                                    <button
                                        onClick={() => setCurrentMediaIndex(prev => prev - 1)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-black/50 text-black dark:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                    >
                                        <FaChevronLeft size={12} />
                                    </button>
                                )}
                                {currentMediaIndex < media.length - 1 && (
                                    <button
                                        onClick={() => setCurrentMediaIndex(prev => prev + 1)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-black/50 text-black dark:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                    >
                                        <FaChevronRight size={12} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Simple Footer Bar
            <div className={`py-4 px-5 border-t flex justify-between items-center ${isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5"}`}>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Verified Organization Content</span>
                <div className="flex gap-2 h-1 w-16">
                    <div className="flex-1 bg-red-600 rounded-full h-full"></div>
                    <div className="flex-1 bg-red-600/30 rounded-full h-full"></div>
                    <div className="flex-1 bg-red-600/10 rounded-full h-full"></div>
                </div>
            </div> */}
        </article>
    );
}
