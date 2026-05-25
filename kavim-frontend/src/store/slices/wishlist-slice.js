import cogoToast from 'cogo-toast';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wishlistService from '../../services/wishlistService';

export const syncWishlistFromAPI = createAsyncThunk('wishlist/syncFromAPI', async (_, { rejectWithValue }) => {
    try {
        const res = await wishlistService.getWishlist();
        return res.data.products;
    } catch {
        return rejectWithValue(null);
    }
});

export const addToWishlistAPI = createAsyncThunk('wishlist/addAPI', async (product, { dispatch, rejectWithValue }) => {
    try {
        const res = await wishlistService.addItem(product.id);
        return res.data.products;
    } catch {
        dispatch(addToWishlist(product));
        return rejectWithValue(null);
    }
});

export const removeFromWishlistAPI = createAsyncThunk('wishlist/removeAPI', async (productId, { dispatch, rejectWithValue }) => {
    try {
        const res = await wishlistService.removeItem(productId);
        return res.data.products;
    } catch {
        dispatch(deleteFromWishlist(productId));
        return rejectWithValue(null);
    }
});

export const clearWishlistAPI = createAsyncThunk('wishlist/clearAPI', async (_, { rejectWithValue }) => {
    try {
        await wishlistService.clearWishlist();
        return [];
    } catch {
        return rejectWithValue(null);
    }
});

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        wishlistItems: []
    },
    reducers: {
        addToWishlist(state, action) {
            const isInWishlist = state.wishlistItems.findIndex(item => item.id === action.payload.id);
            if (isInWishlist > -1) {
                cogoToast.info("Product already in wishlist", { position: "bottom-left" });
            } else {
                state.wishlistItems.push(action.payload);
                cogoToast.success("Added To wishlist", { position: "bottom-left" });
            }
        },
        deleteFromWishlist(state, action) {
            state.wishlistItems = state.wishlistItems.filter(item => item.id !== action.payload);
            cogoToast.error("Removed From Wishlist", { position: "bottom-left" });
        },
        deleteAllFromWishlist(state) {
            state.wishlistItems = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(syncWishlistFromAPI.fulfilled, (state, action) => {
                state.wishlistItems = action.payload;
            })
            .addCase(addToWishlistAPI.fulfilled, (state, action) => {
                state.wishlistItems = action.payload;
                cogoToast.success("Added To wishlist", { position: "bottom-left" });
            })
            .addCase(removeFromWishlistAPI.fulfilled, (state, action) => {
                state.wishlistItems = action.payload;
                cogoToast.error("Removed From Wishlist", { position: "bottom-left" });
            })
            .addCase(clearWishlistAPI.fulfilled, (state) => {
                state.wishlistItems = [];
            });
    },
});

export const { addToWishlist, deleteFromWishlist, deleteAllFromWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
