import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, getStoredUser } from '../../services/authService';
import { apiError } from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { user } = await authService.login(credentials);
    return user;
  } catch (err) {
    return rejectWithValue(apiError(err));
  }
});

const initialUser = getStoredUser();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    isAuthenticated: !!initialUser,
    status: 'idle',
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      authService.logout();
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setUser, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
