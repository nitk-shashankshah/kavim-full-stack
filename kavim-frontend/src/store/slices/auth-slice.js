import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const res = await authService.login(credentials);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.register(data);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        const res = await authService.getProfile();
        return res.data.user;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile');
    }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
    try {
        const res = await authService.updateProfile(data);
        return res.data.user;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Profile update failed');
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
    },
    reducers: {
        logoutUser(state) {
            state.user = null;
            state.token = null;
            state.error = null;
        },
        clearAuthError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            });
    },
});

export const { logoutUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
