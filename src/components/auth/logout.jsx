// src/components/auth/logout.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure, { resetRefreshState } from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/userSlice";
import { clearPosts } from "../../redux/slices/postsSlice";
import { getRefreshToken, clearAllTokens } from "../../redux/store/tokenManager";

function Logout() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const dispatch = useDispatch();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const doLogout = async () => {
      try {
        const refreshToken = getRefreshToken();
        
        // 1. Call logout API first while tokens are still available
        if (refreshToken) {
          await axiosSecure.post(`/v1/auth/logout/`, { refresh: refreshToken });
        }
      } catch (error) {
        console.log("Logout API error (non-blocking):", error.response?.data);
      } finally {
        // 2. Clear Redux state and tokens AFTER the API call
        dispatch(logoutUser()); // This also calls clearAllTokens() inside the reducer
        dispatch(clearPosts());
        
        // 3. Reset module-level refresh state
        resetRefreshState();

        // 4. Redirect
        // App.jsx expects "pendingAlert" in localStorage as a plain string
        localStorage.setItem("pendingAlert", "Logged out successfully.");
        window.location.href = "/";
      }
    };

    doLogout();
  }, [dispatch]);

  // Show a clean fullscreen "Logging out..." screen to prevent navbar flickering or design breaking
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-black uppercase tracking-widest opacity-50 dark:text-gray-400">Logging out...</p>
    </div>
  );
}

export default Logout;