import axios from 'axios';

/**
 * In development the Vite dev server proxies `/api` to the local Express server
 * (see vite.config.ts), so the relative default works. In production the app is
 * hosted on Vercel while the API runs on a separate host, so a relative `/api`
 * would target the Vercel deployment and 404 on every call. Set VITE_API_URL to
 * the API's absolute origin.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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
        const requestUrl = error.config?.url || '';
        const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
        if (!isAuthRequest) {
          const hadToken = localStorage.getItem('auth_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          delete api.defaults.headers.common['Authorization'];
          if (hadToken && !window.location.hash.includes('#reloaded')) {
            window.location.hash = '#reloaded';
            window.location.reload();
          }
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
