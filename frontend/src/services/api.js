import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const api = axios.create({
  baseURL: configuredApiUrl
    ? configuredApiUrl.replace(/\/+$/, '')
    : 'http://localhost:8080/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
