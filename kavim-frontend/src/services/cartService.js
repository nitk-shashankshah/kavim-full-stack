import api from './api';

const cartService = {
    getCart: () => api.get('/cart'),
    addItem: (data) => api.post('/cart/items', data),
    updateItem: (cartItemId, quantity) => api.put(`/cart/items/${cartItemId}`, { quantity }),
    removeItem: (cartItemId) => api.delete(`/cart/items/${cartItemId}`),
    clearCart: () => api.delete('/cart'),
};

export default cartService;
