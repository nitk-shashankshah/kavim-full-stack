import axios from 'axios';
import { store } from '../store/store';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL });

api.interceptors.request.use((config) => {
    const token = store.getState().auth?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
