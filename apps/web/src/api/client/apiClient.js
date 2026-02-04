/**
 * Bellor API Client
 * Main HTTP client with automatic token refresh and error handling
 */

import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// Get API URL from environment variables or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively transform object keys from camelCase to snake_case
 */
function transformKeysToSnakeCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToSnakeCase(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const transformed = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = camelToSnake(key);
      transformed[snakeKey] = transformKeysToSnakeCase(obj[key]);
    }
    return transformed;
  }

  return obj;
}

/**
 * Recursively transform object keys from snake_case to camelCase
 * Used for outgoing requests to match backend Prisma schema
 */
function transformKeysToCamelCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformKeysToCamelCase(item));
  }

  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof FormData)) {
    const transformed = {};
    for (const key of Object.keys(obj)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeysToCamelCase(obj[key]);
    }
    return transformed;
  }

  return obj;
}

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  setupInterceptors() {
    // Request interceptor - add auth token and transform request data
    this.client.interceptors.request.use(
      (config) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Transform request data keys from snake_case to camelCase
        // Skip FormData (used for file uploads)
        if (config.data && !(config.data instanceof FormData)) {
          config.data = transformKeysToCamelCase(config.data);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - transform data and handle token refresh
    this.client.interceptors.response.use(
      (response) => {
        // Transform response data keys from camelCase to snake_case
        if (response.data) {
          response.data = transformKeysToSnakeCase(response.data);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = tokenStorage.getRefreshToken();

            if (!refreshToken) {
              // No refresh token available, logout
              tokenStorage.clearTokens();
              window.location.href = '/Login';
              return Promise.reject(error);
            }

            // Try to refresh the token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data;
            tokenStorage.setAccessToken(accessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            tokenStorage.clearTokens();
            window.location.href = '/Login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   * @param {string} url
   * @param {object} config
   * @returns {Promise}
   */
  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  /**
   * POST request
   * @param {string} url
   * @param {object} data
   * @param {object} config
   * @returns {Promise}
   */
  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   * @param {string} url
   * @param {object} data
   * @param {object} config
   * @returns {Promise}
   */
  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  /**
   * PATCH request
   * @param {string} url
   * @param {object} data
   * @param {object} config
   * @returns {Promise}
   */
  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  /**
   * DELETE request
   * @param {string} url
   * @param {object} config
   * @returns {Promise}
   */
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
