/**
 * Bellor API Client
 * Main HTTP client with automatic token refresh and error handling
 */

import axios from 'axios';
import { tokenStorage } from './tokenStorage';
import { transformKeysToSnakeCase, transformKeysToCamelCase } from './apiTransformers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor - add auth token and transform request data
    this.client.interceptors.request.use(
      (config) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.debug('[apiClient] Request with token:', token.substring(0, 20) + '...');
        } else {
          console.warn('[apiClient] Request WITHOUT token:', config.url);
        }
        if (config.data && !(config.data instanceof FormData)) {
          config.data = transformKeysToCamelCase(config.data);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - transform data and handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        if (response.data) response.data = transformKeysToSnakeCase(response.data);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          console.error(
            '\n%c Backend Server Not Running! %c\n\n' +
            'The API server at ' + API_BASE_URL + ' is not responding.\n\n' +
            'To start the backend, run:\n  npm run dev:api\n',
            'background: #ff4444; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;', ''
          );
          window.dispatchEvent(new CustomEvent('backend-offline', { detail: { url: API_BASE_URL } }));
          error.message = 'Backend server is not running. Please start it with: npm run dev:api';
          return Promise.reject(error);
        }

        // Token refresh on 401
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.warn('[apiClient] 401 Unauthorized - attempting token refresh for:', originalRequest.url);
          originalRequest._retry = true;
          try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (!refreshToken) { tokenStorage.clearTokens(); window.location.href = '/Login'; return Promise.reject(error); }
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const responseData = response.data.data || response.data;
            const accessToken = responseData.accessToken || responseData.access_token;
            if (!accessToken) throw new Error('No access token in refresh response');
            console.log('[apiClient] Token refreshed successfully');
            tokenStorage.setAccessToken(accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            tokenStorage.clearTokens();
            window.location.href = '/Login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) { return this.client.get(url, config); }
  async post(url, data = {}, config = {}) { return this.client.post(url, data, config); }
  async put(url, data = {}, config = {}) { return this.client.put(url, data, config); }
  async patch(url, data = {}, config = {}) { return this.client.patch(url, data, config); }
  async delete(url, config = {}) { return this.client.delete(url, config); }
}

export const apiClient = new ApiClient();
