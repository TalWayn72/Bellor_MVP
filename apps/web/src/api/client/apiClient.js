/**
 * Bellor API Client
 * Main HTTP client with automatic token refresh and error handling
 */

import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// Get API URL from environment variables or default to localhost
// Note: The backend API is served under /api/v1 prefix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
 * Field aliases for backward compatibility
 * Maps backend field names to frontend expected names
 */
const fieldAliases = {
  'created_at': 'created_date',
  'updated_at': 'updated_date',
  'last_active_at': 'last_active_date',
  'birth_date': 'date_of_birth',
};

/**
 * Recursively transform object keys from camelCase to snake_case
 * Also adds field aliases for backward compatibility
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

      // Add field aliases for backward compatibility
      if (fieldAliases[snakeKey]) {
        transformed[fieldAliases[snakeKey]] = transformed[snakeKey];
      }
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
          // Log token status for debugging (only first 20 chars for security)
          console.debug('[apiClient] Request with token:', token.substring(0, 20) + '...');
        } else {
          console.warn('[apiClient] Request WITHOUT token:', config.url);
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

        // Handle network errors (backend not running)
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          console.error(
            '\n%c Backend Server Not Running! %c\n\n' +
            'The API server at ' + API_BASE_URL + ' is not responding.\n\n' +
            'To start the backend, run:\n' +
            '  npm run dev:api\n\n' +
            'Or start all services:\n' +
            '  npm run dev:all\n',
            'background: #ff4444; color: white; font-size: 14px; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
            ''
          );

          // Dispatch custom event for UI to handle
          window.dispatchEvent(new CustomEvent('backend-offline', {
            detail: { url: API_BASE_URL }
          }));

          // Enhance error message
          error.message = `Backend server is not running. Please start it with: npm run dev:api`;
          return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.warn('[apiClient] 401 Unauthorized - attempting token refresh for:', originalRequest.url);
          originalRequest._retry = true;

          try {
            const refreshToken = tokenStorage.getRefreshToken();
            console.log('[apiClient] Refresh token available:', !!refreshToken);

            if (!refreshToken) {
              // No refresh token available, logout
              tokenStorage.clearTokens();
              window.location.href = '/Login';
              return Promise.reject(error);
            }

            // Try to refresh the token
            // Using direct axios to bypass our interceptors
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            // API response structure: { success: true, data: { accessToken: "..." } }
            const responseData = response.data.data || response.data;
            const accessToken = responseData.accessToken || responseData.access_token;

            if (!accessToken) {
              console.error('[apiClient] Token refresh failed - no accessToken in response:', response.data);
              throw new Error('No access token in refresh response');
            }

            console.log('[apiClient] Token refreshed successfully, new token:', accessToken.substring(0, 20) + '...');
            tokenStorage.setAccessToken(accessToken);

            // Verify token was stored
            const storedToken = tokenStorage.getAccessToken();
            console.log('[apiClient] Token stored successfully:', storedToken === accessToken);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            console.log('[apiClient] Retrying request:', originalRequest.url);
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
