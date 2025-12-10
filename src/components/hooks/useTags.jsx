// src/components/hooks/useTags.jsx
import { useEffect, useState } from "react";
import axiosSecure from "../utils/axiosSecure";

export default function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    try {
      // FIXED URL + using axiosSecure
      const res = await axiosSecure.get("/v1/community/tags/");
    

      setTags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Tag load error:", err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return { tags, loading };
}
