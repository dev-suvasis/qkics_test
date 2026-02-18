// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";
import { setAccessToken } from "../store/tokenManager";

/* =====================================
   INIT: Restore UUID from localStorage
===================================== */
const storedUuid = localStorage.getItem("user_uuid");

/* =====================================
   THUNKS
===================================== */

// 1️⃣ Fetch logged-in user profile (partial data, NO uuid)
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.get("/v1/auth/me/");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Failed to fetch profile"
      );
    }
  }
);

// 2️⃣ Login (FULL user object incl. uuid)
export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.post("/v1/auth/login/", credentials);
      const data = res?.data ?? res;

      const accessToken = data?.access;
      const user = data?.user;

      if (!accessToken || !user) {
        throw new Error("Invalid login response");
      }

      setAccessToken(accessToken); // memory-only token
      return user; // contains uuid
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || err.message || "Login failed"
      );
    }
  }
);

// 3️⃣ Update profile (partial update)
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", payload);
      return res.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || "Profile update failed"
      );
    }
  }
);

/* =====================================
   SLICE
===================================== */

const userSlice = createSlice({
  name: "user",

  initialState: {
    // ✅ Restore uuid immediately if available
    data: storedUuid ? { uuid: storedUuid } : null,
    role: null,
    status: "idle", // idle | loading | success | error
    error: null,
    // ✅ UI / Theme state
    theme: localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    // ✅ Profile viewer state
    activeProfileData: null,
  },

  reducers: {
    logoutUser: (state) => {
      state.data = null;
      state.role = null;
      state.status = "error";
      state.error = null;

      // ✅ Clear persisted identity
      localStorage.removeItem("user_uuid");
      setAccessToken(null);
    },

    setUserRole: (state, action) => {
      state.role = action.payload;
    },

    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem("theme", action.payload);
    },

    setActiveProfileData: (state, action) => {
      state.activeProfileData = action.payload;
    },

    clearActiveProfileData: (state) => {
      state.activeProfileData = null;
    },

    // Call this immediately after a successful profile picture upload.
    // Directly patches state.user.data so the navbar updates instantly
    // without waiting for a second /auth/me/ round-trip.
    updateProfilePicture: (state, action) => {
      if (state.data) {
        state.data.profile_picture = action.payload;
      }
    },
  },

  extraReducers: (builder) => {
    builder

      /* -------- FETCH PROFILE -------- */
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = "success";

        // ✅ MERGE (never overwrite uuid)
        state.data = {
          ...state.data,
          ...action.payload,
        };

        state.role = action.payload.role || state.role;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = "error";
        state.data = null;
        state.role = null;
        state.error =
          action.payload ||
          action.error?.message ||
          "Failed to fetch profile";
      })

      /* -------- LOGIN -------- */
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "success";
        state.data = action.payload;
        state.role = action.payload.role || null;
        state.error = null;

        // ✅ Persist uuid safely
        if (action.payload?.uuid) {
          localStorage.setItem("user_uuid", action.payload.uuid);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "error";
        state.error =
          action.payload || action.error?.message || "Login failed";
      })

      /* -------- PROFILE UPDATE -------- */
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.data = {
          ...state.data,
          ...action.payload,
        };
      });
  },
});

export const {
  logoutUser,
  setUserRole,
  setTheme,
  setActiveProfileData,
  clearActiveProfileData,
  updateProfilePicture,
} = userSlice.actions;
export default userSlice.reducer;