import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosSecure from "../../components/utils/axiosSecure";

/* --------------------------------
   THUNKS
--------------------------------- */

// CREATE BOOKING
export const createBooking = createAsyncThunk(
  "booking/create",
  async ({ slotUuid, bookingType }, { rejectWithValue }) => {
    try {
      const res = await axiosSecure.post("/v1/bookings/", {
        slot_id: slotUuid,
        session_type: bookingType,
      });

      return res.data; // { price: "299.00" }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.non_field_errors?.[0] ||
        "Booking failed"
      );
    }
  }
);

/* --------------------------------
   SLICE
--------------------------------- */

const bookingSlice = createSlice({
  name: "booking",
  initialState: {
    loading: false,
    success: false,
    price: null,
    call_Room_id: null,
    error: null,
  },
  reducers: {
    resetBookingState: (state) => {
      state.loading = false;
      state.success = false;
      state.price = null;
      state.call_Room_id = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ---------- CREATE BOOKING ---------- */
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.price = action.payload.price;
        state.call_Room_id = action.payload.call_Room_id;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetBookingState } = bookingSlice.actions;
export default bookingSlice.reducer;
