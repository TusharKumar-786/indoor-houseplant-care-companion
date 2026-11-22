import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || '';
let baseURL: string;
if (rawApiUrl) {
  let cleaned = rawApiUrl.replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned += '/api';
  }
  baseURL = cleaned;
} else {
  baseURL = '/api';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('plantcare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking auth on load
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('plantcare_token');
        localStorage.removeItem('plantcare_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
