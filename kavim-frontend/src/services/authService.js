import api from './api';

const authService = {
    login: (credentials) => api.post('/users/login', credentials),
    register: (data) => api.post('/users/register', data),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
};

export default authService;
