import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { mockGet, mockPost, mockPatch, mockDelete, mockPut } from './mocks';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

const api = axios.create({
  baseURL: 'http://localhost:8080/v1/core',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Inject auth token & tenant header if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    const tenantId = localStorage.getItem('tenantId');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (tenantId) config.headers['X-Tenant-Id'] = tenantId;
  }
  return config;
});

api.interceptors.response.use(
  (resp) => resp,
  (error: AxiosError) => {
    const data = (error.response?.data ?? undefined) as { message?: string } | undefined;
    const apiError: ApiError = {
      status: error.response?.status || 0,
      message: data?.message || error.message || 'Unknown error',
      details: error.response?.data,
    };
    return Promise.reject(apiError);
  }
);

// Lightweight wrapper to allow conditional mock usage
export const apiClient = {
  get: (url: string, config?: AxiosRequestConfig) => {
    // Only force real backend for auth endpoints; allow others to be mocked when enabled
    if (/^\/auth\//.test(url)) return api.get(url, config);
    return useMocks ? mockGet(url) : api.get(url, config);
  },
  post: (url: string, data?: unknown, config?: AxiosRequestConfig) => {
    if (/^\/auth\/(login|signup|refresh|logout)/.test(url)) {
      return useMocks ? mockPost(url, data) : api.post(url, data, config);
    }
    return useMocks ? mockPost(url, data) : api.post(url, data, config);
  },
  patch: (url: string, data?: unknown, config?: AxiosRequestConfig) =>
    useMocks ? mockPatch(url, data) : api.patch(url, data, config),
  put: (url: string, data?: unknown, config?: AxiosRequestConfig) =>
    useMocks ? mockPut(url, data) : api.put(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) =>
    useMocks ? mockDelete(url) : api.delete(url, config),
  raw: api,
};

export default apiClient;