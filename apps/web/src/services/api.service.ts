import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const savedToken = localStorage.getItem('auth_token');
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[API Error]', error.response.status, error.response.data);
      if (error.response.status === 401) {
        const hadToken = localStorage.getItem('auth_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete api.defaults.headers.common['Authorization'];
        if (hadToken && !window.location.hash.includes('#reloaded')) {
          window.location.hash = '#reloaded';
          window.location.reload();
        }
      }
    } else if (error.request) {
      console.error('[API Error] No response received');
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
