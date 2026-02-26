// src/components/auth/logout.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure, { resetRefreshState } from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/userSlice";
import { clearPosts } from "../../redux/slices/postsSlice";
import { getRefreshToken } from "../../redux/store/tokenManager";

function Logout() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const dispatch = useDispatch();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const doLogout = async () => {
      // Reset the module-level refresh state first so queued requests
      // don't hang waiting for a token that will never come
      resetRefreshState();

      try {
        const refreshToken = getRefreshToken();
        // Send the refresh token in the body so the backend can blacklist it
        await axiosSecure.post(
          `/v1/auth/logout/`,
          refreshToken ? { refresh: refreshToken } : {},
          { withCredentials: true }
        );
      } catch (error) {
        // Don't block logout if the API call fails — we still clear everything
        console.log("Logout API error:", error.response?.data);
      } finally {
        // ✅ Always runs — clears all tokens, uuid, Redux state, post cache
        dispatch(logoutUser()); // calls clearAllTokens() internally
        dispatch(clearPosts());
        showAlert("Logged out successfully.", "success");
        navigate("/");
      }
    };

    doLogout();
  }, [navigate, dispatch]);

  return null;
}

export default Logout;