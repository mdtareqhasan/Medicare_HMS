import axios, { InternalAxiosRequestConfig } from 'axios';

// Standardized storage keys for consistency across the application
const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';
const ROLE_KEY = 'userRole';

// Use VITE_API_BASE_URL for flexibility (e.g. pointing at a staging backend).
// If not set, default to the local backend URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getToken = () => localStorage.getItem(TOKEN_KEY);

// Request interceptor: attach token + normalize path
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (
      config.url &&
      typeof config.url === 'string' &&
      !config.url.startsWith('http') &&
      !config.url.startsWith('/api')
    ) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Prevent repeated logout triggers if multiple requests fail with 401 simultaneously
let isLoggingOut = false;
let logoutTimeout: NodeJS.Timeout | null = null;

// Response interceptor: handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    // Only redirect to login on 401 for non-auth endpoints
    // Skip auth endpoints themselves to avoid infinite loops
    // Skip users/me check failures - use localStorage fallback instead
    // Use isLoggingOut flag so multiple simultaneous 401s only trigger logout once
    if (
      status === 401 &&
      !isLoggingOut &&
      !url.includes('/api/auth/') &&
      !url.includes('/users/me')
    ) {
      isLoggingOut = true;
      console.warn(`[axios] 401 Unauthorized — session may have expired: ${url}`);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      // Small delay so any in-flight toasts can show before redirect
      if (logoutTimeout) clearTimeout(logoutTimeout);
      logoutTimeout = setTimeout(() => {
        isLoggingOut = false; // Reset flag after redirect
        window.location.href = '/auth';
      }, 500);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;