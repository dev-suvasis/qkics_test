// src/components/hooks/useFeed.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { normalizePost } from "../utils/normalizePost";

export default function useFeed(_, searchQuery) {
  const [posts, setPosts]   = useState([]);
  const [next, setNext]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const loaderRef           = useRef(null);

  // ── FIX #5: Store `next` in a ref so the IntersectionObserver callback
  // always reads the current URL even if the effect hasn't re-run yet.
  // Without this, loadMore() closes over a stale `next` and can fire a
  // duplicate request for a page that was already loaded.
  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; }, [next]);

  const extractResults = (data) => {
    if (Array.isArray(data)) return { results: data, next: null };
    return { results: data.results || [], next: data.next || null };
  };

  const getClient = () => {
    const token = getAccessToken();
    return token ? axiosSecure : axios;
  };

  /** -----------------------------------------------------------------------
   * LOAD FEED (initial load or search change)
   * FIX #4: Wrapped in try/catch — API errors now surface to the UI instead
   * of propagating silently and leaving the feed frozen with no feedback.
   * loading/error state exposed so callers can show spinners and retry UI.
   * ----------------------------------------------------------------------- */
  const loadFeed = useCallback(async () => {
    const client = getClient();
    const token  = getAccessToken();

    const prefix = token
      ? "/v1"
      : `${import.meta.env.VITE_API_URL}/api/v1`;

    const url =
      searchQuery && searchQuery.trim() !== ""
        ? `${prefix}/community/search/?q=${searchQuery.replace(/-/g, " ")}`
        : `${prefix}/community/posts/`;

    setPosts([]);
    setNext(null);
    nextRef.current = null;
    setError(null);
    setLoading(true);

    try {
      const res    = await client.get(url);
      const parsed = extractResults(res.data);
      setPosts(parsed.results.map(normalizePost));
      setNext(parsed.next);
      nextRef.current = parsed.next;
    } catch (err) {
      // Don't swallow the error — let the page show a retry button
      console.error("useFeed: loadFeed failed", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  /** -----------------------------------------------------------------------
   * LOAD MORE (infinite scroll)
   * FIX #4: try/catch so a failed page load doesn't silently break scroll.
   * FIX #5: Reads from nextRef (always current) instead of the closed-over
   * `next` state value, which could be stale when the observer fires.
   * useCallback with [] keeps a stable reference so the observer never
   * captures an outdated copy of this function.
   * ----------------------------------------------------------------------- */
  const loadMore = useCallback(async () => {
    const currentNext = nextRef.current;
    if (!currentNext) return;

    const client = getClient();

    try {
      const res    = await client.get(currentNext);
      const parsed = extractResults(res.data);
      setPosts((prev) => [...prev, ...parsed.results.map(normalizePost)]);
      setNext(parsed.next);
      nextRef.current = parsed.next;
    } catch (err) {
      console.error("useFeed: loadMore failed", err);
      // Don't set global error here — the existing posts are still visible.
      // A toast or inline "load more" button can handle this case if needed.
    }
  }, []); // stable — reads state via ref, writes via setter

  /** -----------------------------------------------------------------------
   * INFINITE SCROLL OBSERVER
   * Now safe: loadMore is stable (useCallback []) so the observer is only
   * recreated when `next` changes — i.e. when a new page URL is available.
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
   * Debounced 300ms. loadFeed is stable per searchQuery value (useCallback).
   * ----------------------------------------------------------------------- */
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadFeed();
    }, 300);

    return () => clearTimeout(debounce);
  }, [loadFeed]);

  // Expose loading/error so pages can render spinners and retry buttons
  return { posts, setPosts, loaderRef, next, loading, error, reload: loadFeed };
}