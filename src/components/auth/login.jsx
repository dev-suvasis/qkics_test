// src/components/auth/Login.jsx
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";

function LoginModal({ onClose, openSignup, isDark }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      showAlert("Login successful!", "success");
      onClose();
    } catch (err) {
      console.log(err);
      showAlert("Login failed", "error");
    }

    setLoading(false);
  };

    // ENTER KEY TRIGGER LOGIN
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleLogin();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className={`p-6 rounded-2xl shadow-xl w-96 ${bg}`}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Login</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value.trim())}
        className={`w-full px-3 py-2 rounded border mb-3 ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`w-full px-3 py-2 rounded border ${
          isDark ? "bg-neutral-700 border-neutral-600" : "bg-neutral-50"
        }`}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full mt-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <button onClick={() => {
    console.log("🔥 LOGIN → SIGNUP CLICKED");
    openSignup();
  }} className="w-full mt-2 text-sm underline">
        Create an account
      </button>
    </div>
  );
}

export default LoginModal;
