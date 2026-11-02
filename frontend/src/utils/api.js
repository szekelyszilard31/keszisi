import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// JWT token automatikus hozzáadása
API.interceptors.request.use(config => {
  const token = localStorage.getItem('keszisi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 esetén kijelentkezés
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('keszisi_token');
      if (window.location.pathname.startsWith('/admin') &&
          !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;
