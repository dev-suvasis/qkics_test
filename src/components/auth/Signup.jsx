// src/components/auth/SignupModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
// import axiosSecure from "../utils/axiosSecure";
import { API_BASE_URL } from "../../config/api";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";

function SignupModal({ onClose, openLogin, isDark }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [usernameErr, setUsernameErr] = useState("");

  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  // const [userType, setUserType] = useState("normal");

  const [loading, setLoading] = useState(false);

  const bg = isDark ? "bg-neutral-800 text-white" : "bg-white text-black";

  

  // USERNAME VALIDATION
  const handleUsernameChange = async (value) => {
    value = value.toLowerCase();
    setUsername(value);

    if (!/^[a-z0-9]+$/.test(value)) {
      setUsernameErr("Only letters & numbers allowed");
      return;
    }

    if (value.length < 3) {
      setUsernameErr("Username must be at least 3 chars");
      return;
    }

    setUsernameErr("");

    try {
      const res = await axios.post(`${API_BASE_URL}v1/auth/check-username/`, {
        username: value,
      });

      if (!res.data.available) setUsernameErr("Username already taken");
    } catch (err){
      console.log("Username validation error:", err);
    }
  };

  // EMAIL VALIDATION
  const handleEmailChange = async (value) => {
    value = value.toLowerCase();
    setEmail(value);
    setEmailErr("");

    if (!value) return;

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailErr("Invalid email");
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}v1/auth/check-email/`, {
        email: value,
      });

      if (!res.data.available) setEmailErr("Email already exists");
    } catch (err){
      console.log("Email validation error:", err);
    }
  };

  // PHONE VALIDATION
  const handlePhoneChange = async (value) => {
    if (!/^[0-9]*$/.test(value)) return;

    setPhone(value);
    setPhoneErr("");

    if (value.length > 0 && value.length !== 10) {
      setPhoneErr("Phone must be 10 digits");
      return;
    }

    try {
      if (value.length === 10) {
        const res = await axios.post(`${API_BASE_URL}v1/auth/check-phone/`, {
          phone: value,
        });

        if (!res.data.available) setPhoneErr("Phone already exists");
      }
    } catch (err){
      console.log("Phone validation error:", err);
    }
  };

  // PASSWORD VALIDATION
  const validatePassword = (val) => {
    setPassword(val);
    if (val.length < 4) {
      setPasswordErr("Password must be at least 4 characters");
    } else {
      setPasswordErr("");
    }
  };

  // SUBMIT SIGNUP
  const handleSignup = async () => {
    if (!username || !password || !password2) {
      showAlert("Enter required fields", "warning");
      return;
    }

    if (password.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }

    if (password !== password2) {
      showAlert("Passwords do not match", "error");
      return;
    }

    if (usernameErr || emailErr || phoneErr) {
      showAlert("Fix validation errors", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username,
        password,
        password2,
        email,          // avoid invalid empty string
        phone,
        user_type:"normal", // REQUIRED
      };

      await axios.post(`${API_BASE_URL}v1/auth/register/`, payload);


      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Signup succeeded but login failed", "error");
        return;
      }

      await dispatch(fetchUserProfile());
      showAlert("Signup successful!", "success");
      onClose();
    } catch (err) {
  console.log("🔥 SIGNUP ERROR FULL →", err);
  console.log("🔥 SIGNUP ERROR RESPONSE →", err.response);

  showAlert(
    err.response?.data?.detail ||
    err.response?.data?.message ||
    "Signup failed. Try again.",
    "error"
  );
}


    setLoading(false);
  };


  // ENTER KEY → SUBMIT SIGNUP
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleSignup();
    };
    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-96 space-y-3 ${bg}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Sign Up</h2>
        <button onClick={onClose}>✕</button>
      </div>

      {/* USERNAME */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />
      {usernameErr && <p className="text-red-500 text-xs">{usernameErr}</p>}

      {/* PASSWORD */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => validatePassword(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />
      {passwordErr && <p className="text-red-500 text-xs">{passwordErr}</p>}

      <input
        type="password"
        placeholder="Confirm Password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />

      {/* EMAIL */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
        required
      />
      {emailErr && <p className="text-red-500 text-xs">{emailErr}</p>}

      {/* PHONE */}
      <input
        type="text"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />
      {phoneErr && <p className="text-red-500 text-xs">{phoneErr}</p>}

      {/* USER TYPE */}
      {/* <div className="mt-2">
        <p className="text-sm mb-1">Select Account Type</p>

        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="normal"
            checked={userType === "normal"}
            onChange={() => setUserType("normal")}
          />
          <span>Normal</span>
        </label>
      </div> */}

      <button
        onClick={handleSignup}
        disabled={loading}
        className="w-full py-2 rounded bg-red-600 text-white hover:bg-red-700"
      >
        {loading ? "Creating..." : "Create Account"}
      </button>

      <button onClick={() => {
    console.log("🔥 SIGNUP → LOGIN CLICKED");
    openLogin();
  }} className="w-full text-sm underline">
        Already have an account? Login
      </button>
    </div>
  );
}

export default SignupModal;
