import api from './api';

const categoryService = {
    getCategories: () => api.get('/categories'),
    getCategoryById: (id) => api.get(`/categories/${id}`),
};

export default categoryService;
