// src/components/auth/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";

function LoginModal({ onClose, openSignup, isDark }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const bg = isDark ? "bg-neutral-800 text-white" : "bg-white text-black";

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("Enter username and password", "warning");
      return;
    }

    if (password.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }

    setLoading(true);

    try {
      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Invalid username or password", "error");
        setLoading(false);
        return;
      }

      await dispatch(fetchUserProfile());

      // ✅ FIX #1: No more window.location.reload()
      // Redux state is now populated — React will re-render the entire tree
      // automatically. No page reload needed, no Redux state wipe, no
      // WebSocket disconnection, no scroll position loss.
      showAlert("Login successful!", "success");
      onClose();
    } catch (err) {
      console.log(err);
      showAlert("Login failed", "error");
    }

    setLoading(false);
  };

  // ✅ FIX #3: Store handleLogin in a ref so the keydown listener always
  // calls the latest version without needing to re-register itself.
  // The effect runs only once (empty dep array) — no more stacked listeners
  // or stale closure double-submit bug.
  const handleLoginRef = useRef(handleLogin);
  useEffect(() => {
    handleLoginRef.current = handleLogin;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleLoginRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // ← empty array: registers once, never stacks

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-[90%] max-w-sm ${bg}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Login</h2>
        <button
          onClick={onClose}
          className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "hover:bg-white/10 text-neutral-400" : "hover:bg-black/5 text-neutral-500"
            }`}
        >✕</button>
      </div>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value.trim())}
        className={`w-full px-3 py-2 rounded border mb-3 ${isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
          }`}
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

      <button
        onClick={handleLogin}
        disabled={loading}
        className={`w-full mt-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${loading
          ? "bg-neutral-500/20 text-neutral-500 cursor-not-allowed"
          : "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20 hover:shadow-red-600/40"
          }`}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="mt-6 text-center">
        <button onClick={() => {
          openSignup();
        }} className={`text-[10px] font-black uppercase tracking-widest hover:underline ${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
          }`}>
          Don't have an account? <span className="text-red-600">Join QKICS</span>
        </button>
      </div>
    </div>
  );
}

export default LoginModal;