/**
 * Bellor API Client
 * Main HTTP client with automatic token refresh and error handling
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from './tokenStorage';
import { transformKeysToSnakeCase, transformKeysToCamelCase } from './apiTransformers';
import { reportAuthRedirect } from '@/security/securityEventReporter';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token and transform request data
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data && !(config.data instanceof FormData)) {
          config.data = transformKeysToCamelCase(config.data);
        }
        return config;
      },
      (error: unknown) => Promise.reject(error)
    );

    // Response interceptor - transform data and handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (response.data) response.data = transformKeysToSnakeCase(response.data);
        return response;
      },
      async (error: unknown) => {
        const axiosError = error as {
          config: RetryableConfig;
          code?: string;
          message?: string;
          response?: { status: number };
        };
        const originalRequest = axiosError.config;

        // Handle network errors
        if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
          window.dispatchEvent(new CustomEvent('backend-offline', { detail: { url: API_BASE_URL } }));
          if (axiosError.message !== undefined) {
            (axiosError as { message: string }).message =
              'Backend server is not running. Please start it with: npm run dev:api';
          }
          return Promise.reject(error);
        }

        // Token refresh on 401
        if (axiosError.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (!refreshToken) {
              reportAuthRedirect(originalRequest.url || 'unknown', '/Welcome');
              tokenStorage.clearTokens();
              window.location.href = '/Welcome';
              return Promise.reject(error);
            }
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const responseData = response.data.data || response.data;
            const accessToken: string = responseData.accessToken || responseData.access_token;
            if (!accessToken) throw new Error('No access token in refresh response');
            tokenStorage.setAccessToken(accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError: unknown) {
            reportAuthRedirect(originalRequest.url || 'unknown', '/Welcome');
            tokenStorage.clearTokens();
            window.location.href = '/Welcome';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = unknown>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  async put<T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = unknown>(url: string, data: unknown = {}, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = unknown>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
