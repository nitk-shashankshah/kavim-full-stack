import { v4 as uuidv4 } from 'uuid';
import cogoToast from 'cogo-toast';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cartService from '../../services/cartService';

// Map backend cart item shape to the local Redux shape
const mapBackendItem = (item) => ({
    ...item.product,
    cartItemId: item.cartItemId,
    quantity: item.quantity,
    selectedProductColor: item.selectedProductColor || null,
    selectedProductSize: item.selectedProductSize || null,
});

export const syncCartFromAPI = createAsyncThunk('cart/syncFromAPI', async (_, { rejectWithValue }) => {
    try {
        const res = await cartService.getCart();
        return res.data.items.map(mapBackendItem);
    } catch {
        return rejectWithValue(null);
    }
});

export const addToCartAPI = createAsyncThunk('cart/addAPI', async (product, { dispatch, rejectWithValue }) => {
    try {
        const payload = {
            productId: product.id,
            quantity: product.quantity || 1,
            selectedProductColor: product.selectedProductColor || null,
            selectedProductSize: product.selectedProductSize || null,
        };
        const res = await cartService.addItem(payload);
        return res.data.items.map(mapBackendItem);
    } catch {
        // Optimistic local fallback
        dispatch(addToCart(product));
        return rejectWithValue(null);
    }
});

export const updateCartItemAPI = createAsyncThunk('cart/updateAPI', async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
        const res = await cartService.updateItem(cartItemId, quantity);
        return res.data.items.map(mapBackendItem);
    } catch {
        return rejectWithValue(null);
    }
});

export const removeFromCartAPI = createAsyncThunk('cart/removeAPI', async (cartItemId, { dispatch, rejectWithValue }) => {
    try {
        const res = await cartService.removeItem(cartItemId);
        return res.data.items.map(mapBackendItem);
    } catch {
        dispatch(deleteFromCart(cartItemId));
        return rejectWithValue(null);
    }
});

export const clearCartAPI = createAsyncThunk('cart/clearAPI', async (_, { rejectWithValue }) => {
    try {
        await cartService.clearCart();
        return [];
    } catch {
        return rejectWithValue(null);
    }
});

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cartItems: []
    },
    reducers: {
        addToCart(state, action) {
            const product = action.payload;
            if (!product.variation) {
                const cartItem = state.cartItems.find(item => item.id === product.id);
                if (!cartItem) {
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: uuidv4()
                    });
                } else {
                    state.cartItems = state.cartItems.map(item => {
                        if (item.cartItemId === cartItem.cartItemId) {
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1
                            }
                        }
                        return item;
                    })
                }
            } else {
                const cartItem = state.cartItems.find(
                    item =>
                        item.id === product.id &&
                        product.selectedProductColor &&
                        product.selectedProductColor === item.selectedProductColor &&
                        product.selectedProductSize &&
                        product.selectedProductSize === item.selectedProductSize &&
                        (product.cartItemId ? product.cartItemId === item.cartItemId : true)
                );
                if (!cartItem) {
                    state.cartItems.push({
                        ...product,
                        quantity: product.quantity ? product.quantity : 1,
                        cartItemId: uuidv4()
                    });
                } else if (cartItem !== undefined && (cartItem.selectedProductColor !== product.selectedProductColor || cartItem.selectedProductSize !== product.selectedProductSize)) {
                    state.cartItems = [
                        ...state.cartItems,
                        {
                            ...product,
                            quantity: product.quantity ? product.quantity : 1,
                            cartItemId: uuidv4()
                        }
                    ]
                } else {
                    state.cartItems = state.cartItems.map(item => {
                        if (item.cartItemId === cartItem.cartItemId) {
                            return {
                                ...item,
                                quantity: product.quantity ? item.quantity + product.quantity : item.quantity + 1,
                                selectedProductColor: product.selectedProductColor,
                                selectedProductSize: product.selectedProductSize
                            }
                        }
                        return item;
                    });
                }
            }

            cogoToast.success("Added To Cart", { position: "bottom-left" });
        },
        deleteFromCart(state, action) {
            state.cartItems = state.cartItems.filter(item => item.cartItemId !== action.payload);
            cogoToast.error("Removed From Cart", { position: "bottom-left" });
        },
        decreaseQuantity(state, action) {
            const product = action.payload;
            if (product.quantity === 1) {
                state.cartItems = state.cartItems.filter(item => item.cartItemId !== product.cartItemId);
                cogoToast.error("Removed From Cart", { position: "bottom-left" });
            } else {
                state.cartItems = state.cartItems.map(item =>
                    item.cartItemId === product.cartItemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                );
                cogoToast.warn("Item Decremented From Cart", { position: "bottom-left" });
            }
        },
        deleteAllFromCart(state) {
            state.cartItems = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(syncCartFromAPI.fulfilled, (state, action) => {
                state.cartItems = action.payload;
            })
            .addCase(addToCartAPI.fulfilled, (state, action) => {
                state.cartItems = action.payload;
                cogoToast.success("Added To Cart", { position: "bottom-left" });
            })
            .addCase(updateCartItemAPI.fulfilled, (state, action) => {
                state.cartItems = action.payload;
            })
            .addCase(removeFromCartAPI.fulfilled, (state, action) => {
                state.cartItems = action.payload;
                cogoToast.error("Removed From Cart", { position: "bottom-left" });
            })
            .addCase(clearCartAPI.fulfilled, (state) => {
                state.cartItems = [];
            });
    },
});

export const { addToCart, deleteFromCart, decreaseQuantity, deleteAllFromCart } = cartSlice.actions;
export default cartSlice.reducer;
