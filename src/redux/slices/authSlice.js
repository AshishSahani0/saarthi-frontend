import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import { toast } from "react-toastify";

const VERIFICATION_EMAIL_KEY = "emailForVerification";

// -------------------- Thunks --------------------

// Registration
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      // The 'withCredentials: true' flag ensures the browser sends cookies automatically.
      const { data } = await api.post("/auth/register", userData, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// OTP Verification
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (otpData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/verify-otp", otpData, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Resend OTP
export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/resend-otp", { email }, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Load user (Verifies access token via cookie)
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      // The browser sends the httpOnly 'token' cookie automatically
      const { data } = await api.get("/auth/me", { withCredentials: true });
      return data.user;
    } catch {
      return rejectWithValue(null);
    }
  }
);

// Login (Server sets both access and refresh cookies)
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.post("/auth/login", credentials, { withCredentials: true });
      // If successful, the server set the httpOnly cookies. Now load user data.
      await dispatch(loadUser());
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Logout (Server clears both access and refresh cookies)
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      // The server clears the httpOnly cookies in the response
      const { data } = await api.get("/auth/logout", { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Forgot Password
export const forgotPassword = createAsyncThunk( 
  "auth/forgotPassword",
  async (emailData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/forgot-password", emailData, { withCredentials: true });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Reset Password (Server sets new access and refresh cookies)
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, passwords }, { rejectWithValue, dispatch }) => {
    try {
      // Server handles hashing and setting new cookies
      const { data } = await api.put(`/auth/reset-password/${token}`, passwords, { withCredentials: true });
      // Reload user data after a successful password reset/login
      await dispatch(loadUser()); 
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Update Password
export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (passwords, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.put("/auth/update-password", passwords, { withCredentials: true });
      // Optional: Dispatch loadUser if the update also returns new tokens/affects the session
      // For simplicity, we just rely on the success message here.
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.put("/user/update-profile", profileData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      // Reload user to get the updated profile data (e.g., new profile image URL)
      await dispatch(loadUser());
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// -------------------- Slice --------------------
const initialState = {
  user: null,
  isAuthenticated: null, // initially unknown (null)
  loading: false,
  otpRequired: false,
  registeredEmail: localStorage.getItem(VERIFICATION_EMAIL_KEY) || null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthStates: (state) => {
      state.loading = false;
      state.otpRequired = false;
      state.registeredEmail = null;
      state.user = null; // Clear user on manual state clear
      state.isAuthenticated = false; // Set authenticated to false
      localStorage.removeItem(VERIFICATION_EMAIL_KEY);
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { 
        // Only set loading true if it's not already loading, to prevent flicker 
        if (state.loading === false) state.loading = true; 
    };
    const handleRejected = (state, { payload }) => {
      state.loading = false;
      if (payload?.message) toast.error(payload.message);
    };

    builder
      // --- Registration / OTP ---
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.otpRequired = payload.otpRequired; // Assuming server sends true
        state.registeredEmail = payload.user.email;
        localStorage.setItem(VERIFICATION_EMAIL_KEY, payload.user.email);
        toast.success(payload.message);
      })
      .addCase(registerUser.rejected, handleRejected)

      .addCase(verifyOtp.pending, handlePending)
      .addCase(verifyOtp.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.otpRequired = false;
        state.registeredEmail = null;
        localStorage.removeItem(VERIFICATION_EMAIL_KEY);
        toast.success(payload.message || "OTP verified successfully");
      })
      .addCase(verifyOtp.rejected, handleRejected)

      .addCase(resendOtp.pending, handlePending)
      .addCase(resendOtp.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message);
      })
      .addCase(resendOtp.rejected, handleRejected)

      // --- Login / Logout ---
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, { payload }) => { 
            state.loading = false;
            // The success toast is now in loadUser.fulfilled
            // Check for the unverified account error from server 
            if (payload.otpRequired && payload.user?.email) {
                state.otpRequired = true;
                state.registeredEmail = payload.user.email;
                localStorage.setItem(VERIFICATION_EMAIL_KEY, payload.user.email);
                toast.error(payload.message || "Account unverified. Please verify via OTP.");
            }
        })
      .addCase(loginUser.rejected, handleRejected)

      .addCase(logoutUser.pending, handlePending)
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        toast.success("Logged out successfully");
      })
      .addCase(logoutUser.rejected, handleRejected)

      // --- Load User ---
      .addCase(loadUser.pending, (state) => {
        // Only set loading if state is unknown or user is being actively reloaded.
        if (state.isAuthenticated === null) {
            state.loading = true;
        }
    })
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        state.isAuthenticated = !!payload;
        
        // Show success message only if payload exists (user loaded) AND it wasn't a manual token refresh
        if (payload) {
            // Check if loginUser was pending, if so, show the success message now
            if (!state.loading && state.isAuthenticated) {
                 toast.success("Login successful");
            }
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        // Optionally clear cookies/storage on loadUser failure if needed, 
        // though the server should handle that via cookie options.
      })

      // --- Password / Profile Updates ---
      .addCase(updatePassword.pending, handlePending)
      .addCase(updatePassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message || "Password updated successfully");
      })
      .addCase(updatePassword.rejected, handleRejected)

      .addCase(updateProfile.pending, handlePending)
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false;
        // state.user update is now handled by loadUser dispatch in the thunk
        toast.success(payload.message || "Profile updated successfully");
      })
      .addCase(updateProfile.rejected, handleRejected)

      // --- Forgot / Reset Password ---
      .addCase(forgotPassword.pending, handlePending)
      .addCase(forgotPassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        toast.success(payload.message);
      })
      .addCase(forgotPassword.rejected, handleRejected)

      .addCase(resetPassword.pending, handlePending)
      .addCase(resetPassword.fulfilled, (state, { payload }) => {
        state.loading = false;
        // The success toast and loadUser dispatch are now in the thunk
        toast.success(payload.message);
      })
      .addCase(resetPassword.rejected, handleRejected);
  },
});

export const { clearAuthStates } = authSlice.actions;
export default authSlice.reducer;
