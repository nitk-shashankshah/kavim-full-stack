import api from './api';

const productService = {
    getProducts: (params) => api.get('/products', { params }),
    getProductById: (id) => api.get(`/products/${id}`),
};

export default productService;
