// src/components/auth/logout.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure from "../utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/userSlice";
import { setAccessToken } from "../../redux/store/tokenManager";

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
        await axiosSecure.post(
          `/v1/auth/logout/`,
          {},
          { withCredentials: true }
        );

        // 🔥 Clear Redux user state
        dispatch(logoutUser());

        // 🔥 Clear local storage
        setAccessToken(null);

        showAlert("Logged out successfully.", "success");
        navigate("/");
      } catch (error) {
        console.log("Logout error:", error.response?.data);
      }
    };

    doLogout();
  }, [navigate, dispatch]);

  return null;
}

export default Logout;
