import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import { toast } from "react-toastify";

// Key for storing email in local storage for OTP verification flow
const VERIFICATION_EMAIL_KEY = "emailForVerification";

const initialState = {
  user: null,
  isAuthenticated: null,
  loading: false,
  otpRequired: false,
  registeredEmail: localStorage.getItem(VERIFICATION_EMAIL_KEY) || null,
};

// --- Thunks ---

/** Registers a new user */
export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Verifies the OTP code */
export const verifyOtp = createAsyncThunk("auth/verifyOtp", async (otpData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/verify-otp", otpData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Logs in a user, then immediately loads user data */
export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue, dispatch }) => {
  try {
    const response = await api.post("/auth/login", credentials);
    // If login is successful, attempt to load the user profile
    await dispatch(loadUser()); 
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Fetches the currently authenticated user's details */
export const loadUser = createAsyncThunk("auth/loadUser", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch {
    // If /auth/me fails (e.g., token expired), return null to clear user state
    return rejectWithValue(null);
  }
});

/** Logs out the user by clearing server-side tokens/cookies */
export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/auth/logout");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Sends a password reset email */
export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (emailData, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/forgot-password", emailData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Resets password using a token */
export const resetPassword = createAsyncThunk("auth/resetPassword", async ({ token, passwords }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/auth/reset-password/${token}`, passwords);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Allows logged-in user to change their password */
export const updatePassword = createAsyncThunk("auth/updatePassword", async (passwords, { rejectWithValue }) => {
  try {
    const { data } = await api.put("/auth/update-password", passwords);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data);
  }
});

/** Updates the user's profile information (including image) */
export const updateProfile = createAsyncThunk("auth/updateProfile", async (profileData, { rejectWithValue, dispatch }) => {
  try {
    const { data } = await api.put("/user/update-profile", profileData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Reload user after a successful profile update to ensure state is fresh
    await dispatch(loadUser()); 
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
    setOtpRequired: (state, action) => {
        state.otpRequired = action.payload.required;
        state.registeredEmail = action.payload.email;
        if (action.payload.email) {
            localStorage.setItem(VERIFICATION_EMAIL_KEY, action.payload.email);
        } else {
            localStorage.removeItem(VERIFICATION_EMAIL_KEY);
        }
    }
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
        state.otpRequired = payload.otpRequired; // Should be true
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
        // Display toast message from API response
        toast.success(payload.message || "OTP verified successfully");
      })
      .addCase(verifyOtp.rejected, handleRejected)

      // Login / Logout
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Handle case where login fails due to unverified account, requiring OTP redirect
        if (payload?.otpRequired && payload.user?.email) {
            state.otpRequired = true;
            state.registeredEmail = payload.user.email;
            localStorage.setItem(VERIFICATION_EMAIL_KEY, payload.user.email);
        } else {
            // Success toast is shown after successful loadUser in its fulfilled handler
            // or if it was a standard login, we can show it here if loadUser wasn't dispatched
            // Since loadUser is dispatched inside loginUser, the success toast is moved there.
        }
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loading = false;
        
        // Handle explicit redirect case for unverified account error (403 from server)
        if (payload?.message === "Your account is not verified. Please check your email for an OTP.") {
            state.otpRequired = true;
            // Assuming the rejected payload still contains the email if needed for OTP screen setup
            const email = payload.user?.email || state.registeredEmail; 
            if (email) {
                state.registeredEmail = email;
                localStorage.setItem(VERIFICATION_EMAIL_KEY, email);
            }
            toast.error(payload.message); // Show the specific error message
        } else if (payload?.message) {
            toast.error(payload.message); // Show generic or other error messages
        }
    })


      .addCase(logoutUser.pending, handlePending)
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        toast.success("Logged out");
      })
      .addCase(logoutUser.rejected, handleRejected)

      // Load user
      .addCase(loadUser.pending, (state) => {
        // Only set loading true if user is null (initial load)
        if (state.user === null) state.loading = true; 
    })
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload;
        state.isAuthenticated = !!payload;
        // Show login success message only after the user profile is successfully loaded
        if (payload && state.isAuthenticated) {
            toast.success("Login successful");
        }
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

export const { clearAuthStates, setOtpRequired } = authSlice.actions;
export default authSlice.reducer;
