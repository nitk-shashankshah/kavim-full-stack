import api from './api';

const wishlistService = {
    getWishlist: () => api.get('/wishlist'),
    addItem: (productId) => api.post('/wishlist/items', { productId }),
    removeItem: (productId) => api.delete(`/wishlist/items/${productId}`),
    clearWishlist: () => api.delete('/wishlist'),
};

export default wishlistService;
