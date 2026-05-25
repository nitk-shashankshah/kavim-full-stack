import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService from '../../services/orderService';

export const placeOrder = createAsyncThunk('order/place', async (billing, { rejectWithValue }) => {
    try {
        const res = await orderService.placeOrder(billing);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to place order');
    }
});

export const fetchOrders = createAsyncThunk('order/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const res = await orderService.getOrders();
        return res.data.orders;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch orders');
    }
});

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        orders: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearOrderError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(placeOrder.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(placeOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.orders.unshift(action.payload.order);
            })
            .addCase(placeOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.orders = action.payload;
            });
    },
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
