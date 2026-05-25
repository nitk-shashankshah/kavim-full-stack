import api from './api';

const orderService = {
    placeOrder: (billing) => api.post('/orders', { billing }),
    getOrders: () => api.get('/orders'),
    getOrderById: (id) => api.get(`/orders/${id}`),
};

export default orderService;
