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
    if (!error.response) {
      error.message = "Server unavailable. Please try again later.";
    } else if (error.response.status >= 502 && error.response.status <= 504) {
      error.message = `Server unavailable. Please try again later.`;
    }
    return Promise.reject(error);
  }
);

export default api;
