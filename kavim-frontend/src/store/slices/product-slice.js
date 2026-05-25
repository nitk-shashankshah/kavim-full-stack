import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';

export const fetchProducts = createAsyncThunk('product/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const res = await productService.getProducts({ limit: 200 });
        return res.data.products;
    } catch (err) {
        return rejectWithValue(null);
    }
});

const productSlice = createSlice({
    name: 'product',
    initialState: {
        products: [],
    },
    reducers: {
        setProducts(state, action) {
            state.products = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.products = action.payload;
            });
    },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;
