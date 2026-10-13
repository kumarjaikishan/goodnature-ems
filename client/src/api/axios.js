import axios from 'axios';
import { clearAuthSession } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_ADDRESS || '/api/',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emstoken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthSession(null, true);
    }
    return Promise.reject(error);
  }
);

export default api;
