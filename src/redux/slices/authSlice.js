// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import { toast } from "react-toastify";

const VERIFICATION_EMAIL_KEY = "emailForVerification";

const initialState = {
  user: null,
  isAuthenticated: null,
  loading: false,
  otpRequired: false,
  registeredEmail: localStorage.getItem(VERIFICATION_EMAIL_KEY) || null,
};

// --- Thunks ---
export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const verifyOtp = createAsyncThunk("auth/verifyOtp", async (otpData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/verify-otp", otpData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue, dispatch }) => {
  try {
    const { data } = await api.post("/auth/login", credentials);
    await dispatch(loadUser());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const loadUser = createAsyncThunk("auth/loadUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch {
    return rejectWithValue(null);
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/logout");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (emailData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/forgot-password", emailData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, passwords }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/auth/reset-password/${token}`, passwords);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updatePassword = createAsyncThunk("auth/updatePassword", async (passwords, { rejectWithValue }) => {
  try {
    const { data } = await api.put("/auth/update-password", passwords);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put("/user/update-profile", profileData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

// --- Slice ---
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthStates: (state) => {
      state.loading = false;
      state.otpRequired = false;
      state.registeredEmail = null;
      localStorage.removeItem(VERIFICATION_EMAIL_KEY);
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; };
    const handleRejected = (state, { payload }) => {
      state.loading = false;
      if (payload?.message) toast.error(payload.message);
    };

    builder
      // Register / OTP
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.otpRequired = true;
        state.registeredEmail = payload.user.email;
        localStorage.setItem(VERIFICATION_EMAIL_KEY, payload.user.email);
        toast.success(payload.message);
      })
      .addCase(registerUser.rejected, handleRejected)

      .addCase(verifyOtp.pending, handlePending)
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpRequired = false;
        state.registeredEmail = null;
        localStorage.removeItem(VERIFICATION_EMAIL_KEY);
        toast.success("OTP verified successfully");
      })
      .addCase(verifyOtp.rejected, handleRejected)

      // Login / Logout
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
        toast.success("Login successful");
      })
      .addCase(loginUser.rejected, handleRejected)

      .addCase(logoutUser.pending, handlePending)
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        toast.success("Logged out");
      })
      .addCase(logoutUser.rejected, handleRejected)

      // Load user
      .addCase(loadUser.pending, handlePending)
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        state.isAuthenticated = !!payload;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Password / Profile
      .addCase(updatePassword.pending, handlePending)
      .addCase(updatePassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message || "Password updated");
      })
      .addCase(updatePassword.rejected, handleRejected)

      .addCase(updateProfile.pending, handlePending)
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user || state.user;
        toast.success(payload.message || "Profile updated");
      })
      .addCase(updateProfile.rejected, handleRejected)

      // Forgot / Reset password
      .addCase(forgotPassword.pending, handlePending)
      .addCase(forgotPassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message);
      })
      .addCase(forgotPassword.rejected, handleRejected)

      .addCase(resetPassword.pending, handlePending)
      .addCase(resetPassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message);
      })
      .addCase(resetPassword.rejected, handleRejected);
  },
});

export const { clearAuthStates } = authSlice.actions;
export default authSlice.reducer;
