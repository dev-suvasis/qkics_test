import { useState, useEffect } from "react";
import axiosSecure from "../utils/axiosSecure";
import { resolveMedia } from "../utils/mediaUrl";

export default function SponsorCard({ isDark }) {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                // Note: The endpoint remains /v1/ads/active/ for now as it's a backend route,
                // but we keep the frontend variable names neutral.
                const { data } = await axiosSecure.get("/v1/ads/active/");
                if (data && Array.isArray(data)) {
                    setSponsors(data);
                }
            } catch (err) {
                // If it fails (possibly due to adblock), we just log it silently or show nothing
                console.warn("Promotional content could not be loaded.");
            } finally {
                setLoading(false);
            }
        };
        fetchSponsors();
    }, []);

    if (loading) {
        return (
            <div className={`premium-card overflow-hidden group ${isDark ? "bg-neutral-900" : "bg-white"} animate-pulse`}>
                <div className="h-64 bg-neutral-800/10 dark:bg-neutral-800/30" />
            </div>
        );
    }

    if (!sponsors || sponsors.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-8">
            {sponsors.map((item) => (
                <SponsorItem key={item.id || item.uuid} item={item} isDark={isDark} />
            ))}
        </div>
    );
}

function SponsorItem({ item, isDark }) {
    const [mediaError, setMediaError] = useState(false);

    let mediaSrc = resolveMedia(item.file_url);
    if (mediaSrc && mediaSrc.startsWith("/media/")) {
        mediaSrc = `${import.meta.env.VITE_API_URL}${mediaSrc}`;
    }

    const isVideo = item.media_type === "video" || item.media_type === "VIDEO";

    if (mediaError) {
        return null;
    }

    return (
        <div className={`premium-card overflow-hidden group ${isDark ? "bg-neutral-900" : "bg-white"}`}>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {item.placement ? item.placement.replace(/_/g, " ") : "Promoted"}
                    </p>
                </div>
                <div className="relative overflow-hidden rounded-xl mb-6">
                    {isVideo ? (
                        <video
                            src={mediaSrc}
                            controls
                            autoPlay
                            muted
                            loop
                            className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={() => setMediaError(true)}
                        />
                    ) : (
                        <img
                            src={mediaSrc}
                            alt="featured"
                            className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                console.error("Image failed to load:", mediaSrc);
                                setMediaError(true);
                            }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2">{item.title}</h4>
                <p className="opacity-60 text-sm mb-6 leading-relaxed">{item.description}</p>
                <a
                    href={item.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all ${isDark ? "bg-white/5 text-white" : "bg-neutral-100 text-black"}`}
                >
                    {item.button_text || "Explore Now"}
                </a>
            </div>
        </div>
    );
}
