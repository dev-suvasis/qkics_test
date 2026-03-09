// src/components/hooks/useKnowledgeFeed.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import axiosSecure from "../utils/axiosSecure";
import { normalizePost } from "../utils/normalizePost";

export default function useKnowledgeFeed(searchQuery) {
    const [posts, setPosts]     = useState([]);
    const [next, setNext]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const loaderRef             = useRef(null);

    // ── FIX #5: Store `next` in a ref so IntersectionObserver always reads
    // the current URL instead of a stale closed-over value.
    const nextRef = useRef(next);
    useEffect(() => { nextRef.current = next; }, [next]);

    const extractResults = (data) => {
        if (Array.isArray(data)) return { results: data, next: null };
        return { results: data.results || [], next: data.next || null };
    };

    /** -----------------------------------------------------------------------
     * LOAD FEED (initial load or search change)
     * try/catch was already present — now also exposes loading/error state
     * and resets nextRef on every fresh load.
     * ----------------------------------------------------------------------- */
    const loadFeed = useCallback(async () => {
        const url =
            searchQuery && searchQuery.trim() !== ""
                ? `/v1/community/search/?q=${searchQuery.replace(/-/g, " ")}`
                : `/v1/community/posts/`;

        setPosts([]);
        setNext(null);
        nextRef.current = null;
        setError(null);
        setLoading(true);

        try {
            const res    = await axiosSecure.get(url);
            const parsed = extractResults(res.data);
            const filteredResults = parsed.results
                .map(normalizePost)
                .filter((p) => p.knowledge_hub === true);
            setPosts(filteredResults);
            setNext(parsed.next);
            nextRef.current = parsed.next;
        } catch (err) {
            console.error("useKnowledgeFeed: loadFeed failed", err);
            setError("Failed to load knowledge feed. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    /** -----------------------------------------------------------------------
     * LOAD MORE (infinite scroll)
     * FIX #5: Reads nextRef.current (always fresh) instead of closed-over
     * `next` state. useCallback [] keeps a stable reference for the observer.
     * ----------------------------------------------------------------------- */
    const loadMore = useCallback(async () => {
        const currentNext = nextRef.current;
        if (!currentNext) return;

        try {
            const res    = await axiosSecure.get(currentNext);
            const parsed = extractResults(res.data);
            const filteredResults = parsed.results
                .map(normalizePost)
                .filter((p) => p.knowledge_hub === true);
            setPosts((prev) => [...prev, ...filteredResults]);
            setNext(parsed.next);
            nextRef.current = parsed.next;
        } catch (err) {
            console.error("useKnowledgeFeed: loadMore failed", err);
        }
    }, []); // stable — reads state via ref, writes via setter

    /** -----------------------------------------------------------------------
     * INFINITE SCROLL OBSERVER
     * loadMore is stable so this only reconnects when a new page URL arrives.
     * ----------------------------------------------------------------------- */
    useEffect(() => {
        if (!loaderRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { threshold: 0.1 }
        );

        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [next, loadMore]);

    /** -----------------------------------------------------------------------
     * RELOAD FEED WHEN SEARCH CHANGES
     * ----------------------------------------------------------------------- */
    useEffect(() => {
        const debounce = setTimeout(() => {
            loadFeed();
        }, 300);

        return () => clearTimeout(debounce);
    }, [loadFeed]);

    return { posts, setPosts, loaderRef, next, loading, error, reload: loadFeed };
}