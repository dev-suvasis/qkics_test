// src/hooks/useSearchPosts.js
import { useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

export default function useSearchPosts() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const searchPosts = async (query) => {
    // ✅ Minimum 3 characters
    if (!query || query.trim().length < 3) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      const res = await axios.get(
        `${API_BASE_URL}v1/community/search/?q=${encodeURIComponent(
          query
        )}&limit=5`,
        { signal: controllerRef.current.signal }
      );

      setResults(res.data?.results || res.data || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return { searchPosts, results, loading, error };
}
