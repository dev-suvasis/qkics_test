import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";

/* --------------------------------
   THUNKS
--------------------------------- */

// FETCH ALL SLOTS
export const fetchExpertSlots = createAsyncThunk(
  "expertSlots/fetch",
  async (expertUuid, { rejectWithValue }) => {
    try {
      // Use passed UUID (basic profile UUID) or fallback to localStorage
      const uuidToUse = expertUuid || localStorage.getItem("user_uuid");

      if (!uuidToUse) {
        console.warn("⚠️ No expert UUID found for fetching slots");
        return [];
      }

      const res = await axiosSecure.get(
        `/v1/bookings/experts/${uuidToUse}/slots/`
      );
      return res.data;
    } catch (err) {
      console.error(err);
      return rejectWithValue("Failed to fetch slots");
    }
  }
);

// CREATE SLOT
export const createExpertSlot = createAsyncThunk(
  "expertSlots/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.post(
        "/v1/bookings/experts/slots/",
        payload
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail ||
        "Failed to create slot"
      );
    }
  }
);

// UPDATE SLOT
export const updateExpertSlot = createAsyncThunk(
  "expertSlots/update",
  async ({ slotUuid, payload }, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.patch(
        `/v1/bookings/experts/slots/${slotUuid}/`,
        payload
      );
      return { slotUuid, data: res.data };
    } catch (err) {
      console.error(err);
      return rejectWithValue(
        err.response?.data || "Failed to update slot"
      );
    }
  }
);

// DELETE SLOT
export const deleteExpertSlot = createAsyncThunk(
  "expertSlots/delete",
  async (slotUuid, { rejectWithValue }) => {
    try {
      await axiosSecure.delete(
        `/v1/bookings/experts/slots/${slotUuid}/delete/`
      );
      return slotUuid;
    } catch (err) {
      console.error(err);
      return rejectWithValue("Failed to delete slot");
    }
  }
);

/* --------------------------------
   SLICE
--------------------------------- */

const expertSlotsSlice = createSlice({
  name: "expertSlots",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSlots: (state) => {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ---------- FETCH ---------- */
      .addCase(fetchExpertSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpertSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload?.results || []);
      })
      .addCase(fetchExpertSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- CREATE ---------- */
      .addCase(createExpertSlot.pending, (state) => {
        state.error = null;
      })
      .addCase(createExpertSlot.fulfilled, (state, action) => {
        // ✅ Normalize uuid: some API responses use 'id' — ensure uuid is always present
        const payload = action.payload || {};
        const newSlot = {
          is_chat_available: true,
          is_video_call_available: true,
          status: "ACTIVE",
          ...payload,
          uuid: payload.uuid ?? payload.id,
        };
        state.items.unshift(newSlot);
      })
      .addCase(createExpertSlot.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* ---------- UPDATE ---------- */
      .addCase(updateExpertSlot.pending, (state) => {
        state.error = null;
      })
      .addCase(updateExpertSlot.fulfilled, (state, action) => {
        const { slotUuid, data } = action.payload;
        const index = state.items.findIndex(
          (slot) => (slot.uuid ?? slot.id) === slotUuid
        );

        if (index !== -1) {
          state.items[index] = {
            ...state.items[index],
            ...data,
          };
        }
      })
      .addCase(updateExpertSlot.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* ---------- DELETE ---------- */
      .addCase(deleteExpertSlot.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteExpertSlot.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (slot) => (slot.uuid ?? slot.id) !== action.payload
        );
      })
      .addCase(deleteExpertSlot.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSlots } = expertSlotsSlice.actions;
export default expertSlotsSlice.reducer;