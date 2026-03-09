// src/components/auth/SignupModal.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { API_BASE_URL } from "../../config/api";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-username/`, {
        username: value,
      });

      if (!res.data.available) setUsernameErr("Username already taken");
    } catch (err) {
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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-email/`, {
        email: value,
      });

      if (!res.data.available) setEmailErr("Email already exists");
    } catch (err) {
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
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-phone/`, {
          phone: value,
        });

        if (!res.data.available) setPhoneErr("Phone already exists");
      }
    } catch (err) {
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
        email,
        phone,
        user_type: "normal",
      };

      await axios.post(`${API_BASE_URL}/v1/auth/register/`, payload);

      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Signup succeeded but login failed", "error");
        return;
      }

      await dispatch(fetchUserProfile());

      // ✅ No window.location.reload() — Redux is already updated.
      // React will re-render from the new user state automatically.
      showAlert("Signup successful!", "success");
      onClose();
    } catch (err) {
      console.log("SIGNUP ERROR FULL →", err);
      console.log("SIGNUP ERROR RESPONSE →", err.response);

      showAlert(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Signup failed. Try again.",
        "error"
      );
    }

    setLoading(false);
  };

  // ✅ FIX #3: Store handleSignup in a ref so the keydown listener always
  // calls the latest version without re-registering itself every render.
  // The effect runs only once (empty dep array) — no more stacked listeners
  // or stale closure double-submit bug.
  const handleSignupRef = useRef(handleSignup);
  useEffect(() => {
    handleSignupRef.current = handleSignup;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleSignupRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // ← empty array: registers once, never stacks

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-[90%] max-w-sm space-y-3 ${bg}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sign Up</h2>
        <button
          onClick={onClose}
          className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-black/5 text-neutral-500"
            }`}
        >✕</button>
      </div>

      {/* USERNAME */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
          }`}
      />
      {usernameErr && <p className="text-red-500 text-xs">{usernameErr}</p>}

      {/* PASSWORD */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => validatePassword(e.target.value)}
          className={`w-full px-3 py-2 pr-10 rounded border ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
            }`}
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
          className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-400 transition-colors"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {passwordErr && <p className="text-red-500 text-xs">{passwordErr}</p>}

      <div className="relative">
        <input
          type={showPassword2 ? "text" : "password"}
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className={`w-full px-3 py-2 pr-10 rounded border ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
            }`}
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPassword2(!showPassword2); }}
          className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-400 transition-colors"
        >
          {showPassword2 ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* EMAIL */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
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
        className={`w-full px-3 py-2 rounded border ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
          }`}
      />
      {phoneErr && <p className="text-red-500 text-xs">{phoneErr}</p>}

      <button
        onClick={handleSignup}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${loading
          ? "bg-neutral-500/20 text-neutral-500 cursor-not-allowed"
          : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 hover:shadow-red-600/40"
          }`}
      >
        {loading ? "Creating..." : "Create Account"}
      </button>

      <div className="pt-2 text-center">
        <button onClick={() => {
          openLogin();
        }} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
          }`}>
          Already have an account? <span className="text-red-600">Login Here</span>
        </button>
      </div>
    </div>
  );
}

export default SignupModal;