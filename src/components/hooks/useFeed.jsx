// src/components/hooks/useFeed.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";

export default function useFeed(_, searchQuery) {
  const [posts, setPosts] = useState([]);
  const [next, setNext] = useState(null);
  const loaderRef = useRef(null);

  const normalize = (p) => ({
    ...p,
    is_liked:
      p.is_liked === true ||
      p.is_liked === "true" ||
      p.is_liked === 1,
    total_likes: Number(p.total_likes || 0),
    tags: Array.isArray(p.tags) ? p.tags : [],
  });

  const extractResults = (data) => {
    if (Array.isArray(data)) return { results: data, next: null };
    return { results: data.results || [], next: data.next || null };
  };

  const getClient = () => {
    const token = getAccessToken();
    return token ? axiosSecure : axios;
  };

  /** -----------------------------
   * LOAD FEED (NORMAL OR SEARCH)
   -------------------------------- */
 const loadFeed = async () => {
  const client = getClient();
  let url = "";

  if (searchQuery && searchQuery.trim() !== "") {
    // Convert slug: artificial-intelligence → artificial intelligence
    const cleanQuery = searchQuery.replace(/-/g, " ");

    url = `v1/community/search/?q=${cleanQuery}`;
  } else {
    const prefix = getAccessToken() ? "/v1" : "/api/v1";
    url = `${prefix}/community/posts/`;
  }

  setPosts([]);
  setNext(null);

  const res = await client.get(url);
  const parsed = extractResults(res.data);
  const freshPosts = parsed.results.map(normalize);

  setPosts(freshPosts);
  setNext(parsed.next);
};


  /** -----------------------------
   * INFINITE LOAD MORE
   -------------------------------- */
  const loadMore = async () => {
    if (!next) return;

    const client = getClient();
    const res = await client.get(next);
    const parsed = extractResults(res.data);
    const newPosts = parsed.results.map(normalize);

    setPosts((prev) => [...prev, ...newPosts]);
    setNext(parsed.next);
  };

  /** -----------------------------
   * INFINITE SCROLL OBSERVER
   -------------------------------- */
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
  }, [next]);

  /** -----------------------------
   * RELOAD FEED WHEN SEARCH CHANGES
   -------------------------------- */
  useEffect(() => {
    const debounce = setTimeout(() => {
      loadFeed();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return { posts, setPosts, loaderRef };
}
