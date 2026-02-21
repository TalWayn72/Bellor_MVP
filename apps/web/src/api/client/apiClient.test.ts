/**
 * Comprehensive tests for API Client interceptors and transformers.
 *
 * This file tests the ACTUAL production code by importing real transformation
 * functions from apiTransformers.js and exercising the real axios interceptors
 * registered by ApiClient via axios-mock-adapter.
 *
 * Uses vi.spyOn (not vi.mock + vi.resetModules) to avoid unbounded memory
 * growth from repeated module cache resets in isolate:false CI mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import {
  camelToSnake,
  snakeToCamel,
  transformKeysToSnakeCase,
  transformKeysToCamelCase,
  fieldAliases,
} from './apiTransformers';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import * as securityEventReporter from '@/security/securityEventReporter';

// ---------------------------------------------------------------------------
// Module-level axios instance (reused across all tests – no vi.resetModules)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const axiosInstance = (apiClient as any).client;

// ---------------------------------------------------------------------------
// Section 1 - Transformation functions (imported from REAL source)
// ---------------------------------------------------------------------------

describe('[P0][infra] Transformation Functions (from apiTransformers)', () => {
  describe('camelToSnake', () => {
    it('converts camelCase to snake_case', () => {
      expect(camelToSnake('createdAt')).toBe('created_at');
      expect(camelToSnake('firstName')).toBe('first_name');
      expect(camelToSnake('userId')).toBe('user_id');
      expect(camelToSnake('responseType')).toBe('response_type');
    });

    it('leaves already snake_case strings unchanged', () => {
      expect(camelToSnake('created_at')).toBe('created_at');
      expect(camelToSnake('user_id')).toBe('user_id');
    });

    it('leaves single-word lowercase strings unchanged', () => {
      expect(camelToSnake('id')).toBe('id');
      expect(camelToSnake('name')).toBe('name');
      expect(camelToSnake('email')).toBe('email');
    });

    it('handles consecutive uppercase letters', () => {
      expect(camelToSnake('getHTTPResponse')).toBe('get_h_t_t_p_response');
    });

    it('handles empty string', () => {
      expect(camelToSnake('')).toBe('');
    });
  });

  describe('snakeToCamel', () => {
    it('converts snake_case to camelCase', () => {
      expect(snakeToCamel('created_at')).toBe('createdAt');
      expect(snakeToCamel('first_name')).toBe('firstName');
      expect(snakeToCamel('user_id')).toBe('userId');
      expect(snakeToCamel('response_type')).toBe('responseType');
    });

    it('leaves already camelCase strings unchanged', () => {
      expect(snakeToCamel('createdAt')).toBe('createdAt');
      expect(snakeToCamel('firstName')).toBe('firstName');
    });

    it('leaves single-word strings unchanged', () => {
      expect(snakeToCamel('id')).toBe('id');
      expect(snakeToCamel('name')).toBe('name');
    });

    it('handles multiple underscores', () => {
      expect(snakeToCamel('last_active_at')).toBe('lastActiveAt');
    });

    it('handles empty string', () => {
      expect(snakeToCamel('')).toBe('');
    });
  });

  describe('transformKeysToSnakeCase', () => {
    it('transforms flat object keys from camelCase to snake_case', () => {
      const input = { userId: '123', firstName: 'John', lastName: 'Doe' };
      const result = transformKeysToSnakeCase(input);
      expect(result).toEqual(
        expect.objectContaining({ user_id: '123', first_name: 'John', last_name: 'Doe' })
      );
    });

    it('transforms nested objects recursively', () => {
      const input = { userData: { firstName: 'John', profileData: { lastActiveAt: '2024' } } };
      const result = transformKeysToSnakeCase(input);
      expect(result.user_data.first_name).toBe('John');
      expect(result.user_data.profile_data.last_active_at).toBe('2024');
    });

    it('transforms arrays of objects', () => {
      const input = [
        { userId: '1', firstName: 'Alice' },
        { userId: '2', firstName: 'Bob' },
      ];
      const result = transformKeysToSnakeCase(input);
      expect(result[0].user_id).toBe('1');
      expect(result[0].first_name).toBe('Alice');
      expect(result[1].user_id).toBe('2');
    });

    it('handles null and undefined without throwing', () => {
      expect(transformKeysToSnakeCase(null)).toBeNull();
      expect(transformKeysToSnakeCase(undefined)).toBeUndefined();
    });

    it('handles empty objects', () => {
      expect(transformKeysToSnakeCase({})).toEqual({});
    });

    it('handles primitive values passthrough', () => {
      expect(transformKeysToSnakeCase('hello')).toBe('hello');
      expect(transformKeysToSnakeCase(42)).toBe(42);
      expect(transformKeysToSnakeCase(true)).toBe(true);
    });

    it('does not transform Date objects', () => {
      const date = new Date('2024-01-01');
      const input = { createdAt: date };
      const result = transformKeysToSnakeCase(input);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.created_at).toBe(date);
    });

    it('adds field aliases for backward compatibility', () => {
      const input = {
        createdAt: 'ts1',
        updatedAt: 'ts2',
        lastActiveAt: 'ts3',
        birthDate: '1990',
      };
      const result = transformKeysToSnakeCase(input);

      // Original snake_case keys
      expect(result.created_at).toBe('ts1');
      expect(result.updated_at).toBe('ts2');
      expect(result.last_active_at).toBe('ts3');
      expect(result.birth_date).toBe('1990');

      // Aliased keys
      expect(result.created_date).toBe('ts1');
      expect(result.updated_date).toBe('ts2');
      expect(result.last_active_date).toBe('ts3');
      expect(result.date_of_birth).toBe('1990');
    });

    it('adds aliases inside nested objects and arrays', () => {
      const input = { users: [{ createdAt: '2024' }] };
      const result = transformKeysToSnakeCase(input);
      expect(result.users[0].created_at).toBe('2024');
      expect(result.users[0].created_date).toBe('2024');
    });
  });

  describe('transformKeysToCamelCase', () => {
    it('transforms flat object keys from snake_case to camelCase', () => {
      const input = { user_id: '123', first_name: 'John' };
      const result = transformKeysToCamelCase(input);
      expect(result).toEqual({ userId: '123', firstName: 'John' });
    });

    it('transforms nested objects recursively', () => {
      const input = { user_data: { first_name: 'John', profile_data: { is_active: true } } };
      const result = transformKeysToCamelCase(input);
      expect(result.userData.firstName).toBe('John');
      expect(result.userData.profileData.isActive).toBe(true);
    });

    it('transforms arrays of objects', () => {
      const input = [{ user_id: '1' }, { user_id: '2' }];
      const result = transformKeysToCamelCase(input);
      expect(result[0].userId).toBe('1');
      expect(result[1].userId).toBe('2');
    });

    it('handles null and undefined without throwing', () => {
      expect(transformKeysToCamelCase(null)).toBeNull();
      expect(transformKeysToCamelCase(undefined)).toBeUndefined();
    });

    it('handles empty objects', () => {
      expect(transformKeysToCamelCase({})).toEqual({});
    });

    it('handles primitive values passthrough', () => {
      expect(transformKeysToCamelCase('hello')).toBe('hello');
      expect(transformKeysToCamelCase(42)).toBe(42);
    });

    it('does not transform Date objects', () => {
      const date = new Date('2024-06-15');
      const input = { created_at: date };
      const result = transformKeysToCamelCase(input);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('does not transform FormData instances', () => {
      const formData = new FormData();
      formData.append('file_name', 'test.jpg');
      const result = transformKeysToCamelCase(formData);
      expect(result).toBeInstanceOf(FormData);
    });
  });

  describe('fieldAliases mapping', () => {
    it('contains the expected alias entries', () => {
      expect(fieldAliases).toEqual({
        created_at: 'created_date',
        updated_at: 'updated_date',
        last_active_at: 'last_active_date',
        birth_date: 'date_of_birth',
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Section 2 - API Client interceptors and HTTP methods
// ---------------------------------------------------------------------------

describe('[P0][infra] ApiClient (interceptors & HTTP methods)', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Spy on tokenStorage methods so interceptors see controlled values.
    // tokenStorage is an object – spyOn replaces the method on the shared
    // instance, so the interceptors (which call tokenStorage.getAccessToken()
    // via object reference) pick up the spy automatically.
    vi.spyOn(tokenStorage, 'getAccessToken').mockReturnValue(null);
    vi.spyOn(tokenStorage, 'getRefreshToken').mockReturnValue(null);
    vi.spyOn(tokenStorage, 'setAccessToken').mockImplementation(() => {});
    vi.spyOn(tokenStorage, 'clearTokens').mockImplementation(() => {});

    // Suppress fire-and-forget security reports (they hit the backend).
    vi.spyOn(securityEventReporter, 'reportAuthRedirect').mockImplementation(() => {});

    // Attach a fresh MockAdapter to the shared axios instance.
    // This replaces the HTTP adapter for every test without re-creating
    // the ApiClient or re-registering interceptors.
    mock = new MockAdapter(axiosInstance);

    // Suppress location.href assignments in jsdom
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '', assign: vi.fn(), replace: vi.fn() },
    });
  });

  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 2a. Request interceptor
  // -----------------------------------------------------------------------
  describe('Request interceptor', () => {
    it('adds Authorization header when access token exists', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('my-jwt-token');
      mock.onGet('/users/me').reply((config) => {
        expect(config.headers?.Authorization).toBe('Bearer my-jwt-token');
        return [200, { id: '1' }];
      });

      await apiClient.get('/users/me');
    });

    it('does NOT add Authorization header when no token', async () => {
      // getAccessToken already returns null from beforeEach spy
      mock.onGet('/public/health').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { status: 'ok' }];
      });

      await apiClient.get('/public/health');
    });

    it('transforms request body keys to camelCase (snake_case input)', async () => {
      mock.onPost('/users').reply((config) => {
        const body = JSON.parse(config.data);
        // snake_case keys should be converted to camelCase by transformKeysToCamelCase
        expect(body.firstName).toBe('John');
        expect(body.lastName).toBe('Doe');
        expect(body.birthDate).toBe('1990-01-01');
        return [201, { id: '1' }];
      });

      await apiClient.post('/users', {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1990-01-01',
      });
    });

    it('does not transform FormData request bodies', async () => {
      // Spy on the transformer to verify it is NOT called for FormData
      const transformSpy = await import('./apiTransformers');
      const camelSpy = vi.spyOn(transformSpy, 'transformKeysToCamelCase');

      const formData = new FormData();
      formData.append('file_name', 'avatar.jpg');

      mock.onPost('/upload').reply(200, { url: 'https://cdn.example.com/avatar.jpg' });

      await apiClient.post('/upload', formData);

      // The interceptor checks instanceof FormData and skips transformation.
      // transformKeysToCamelCase should NOT have been called with the FormData instance.
      const formDataCalls = camelSpy.mock.calls.filter(
        ([arg]) => arg instanceof FormData
      );
      expect(formDataCalls).toHaveLength(0);

      camelSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // 2b. Response interceptor
  // -----------------------------------------------------------------------
  describe('Response interceptor', () => {
    it('transforms response data keys to snake_case (with aliases)', async () => {
      mock.onGet('/users/me').reply(200, {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-01T00:00:00Z',
        birthDate: '1990-05-15',
      });

      const response = await apiClient.get<Record<string, any>>('/users/me');

      expect(response.data.first_name).toBe('John');
      expect(response.data.last_name).toBe('Doe');
      expect(response.data.created_at).toBe('2024-01-01T00:00:00Z');
      // Aliases
      expect(response.data.created_date).toBe('2024-01-01T00:00:00Z');
      expect(response.data.date_of_birth).toBe('1990-05-15');
    });

    it('transforms nested response data', async () => {
      mock.onGet('/feed').reply(200, {
        items: [
          { responseType: 'TEXT', createdAt: '2024-01-01' },
          { responseType: 'IMAGE', createdAt: '2024-01-02' },
        ],
        paginationInfo: { hasMore: true, totalCount: 50 },
      });

      const response = await apiClient.get<Record<string, any>>('/feed');

      expect(response.data.items[0].response_type).toBe('TEXT');
      expect(response.data.items[0].created_date).toBe('2024-01-01');
      expect(response.data.pagination_info.has_more).toBe(true);
      expect(response.data.pagination_info.total_count).toBe(50);
    });

    it('handles null response data gracefully', async () => {
      mock.onDelete('/users/1').reply(204);

      const response = await apiClient.delete('/users/1');
      // 204 has no body - data is empty string from axios-mock-adapter
      expect(response.status).toBe(204);
    });
  });

  // -----------------------------------------------------------------------
  // 2c. Token refresh on 401
  // -----------------------------------------------------------------------
  describe('401 Token refresh flow', () => {
    it('attempts token refresh and retries original request on 401', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('valid-refresh-token');

      let callCount = 0;
      mock.onGet('/users/me').reply(() => {
        callCount++;
        if (callCount === 1) {
          return [401, { message: 'Token expired' }];
        }
        // Second call after successful refresh
        return [200, { id: 'user-1', firstName: 'John' }];
      });

      // Mock the refresh endpoint (called via plain axios, not through the client)
      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: { accessToken: 'new-access-token' } },
      });

      const response = await apiClient.get<Record<string, any>>('/users/me');

      // Verify refresh was called with the refresh token
      expect(axiosPostSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refreshToken: 'valid-refresh-token' }
      );

      // Verify new token was stored
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('new-access-token');

      // Verify the retried request succeeded
      expect(response.status).toBe(200);
      // Response data is transformed by the response interceptor
      expect(response.data.first_name).toBe('John');

      axiosPostSpy.mockRestore();
    });

    it('handles refresh response with access_token (snake_case) field', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('valid-refresh-token');

      mock.onGet('/users/me').replyOnce(401).onGet('/users/me').replyOnce(200, { id: '1' });

      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { access_token: 'new-token-snake' },
      });

      const response = await apiClient.get('/users/me');

      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('new-token-snake');
      expect(response.status).toBe(200);

      axiosPostSpy.mockRestore();
    });

    it('clears tokens and redirects to /Welcome when no refresh token', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      // getRefreshToken already returns null from beforeEach spy

      mock.onGet('/protected').reply(401, { message: 'Unauthorized' });

      await expect(apiClient.get('/protected')).rejects.toThrow();

      expect(tokenStorage.clearTokens).toHaveBeenCalled();
      expect(window.location.href).toBe('/Welcome');
      expect(securityEventReporter.reportAuthRedirect).toHaveBeenCalledWith(
        expect.any(String),
        '/Welcome'
      );
    });

    it('clears tokens and redirects when refresh call itself fails', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('invalid-refresh');

      mock.onGet('/protected').reply(401, { message: 'Unauthorized' });

      const axiosPostSpy = vi.spyOn(axios, 'post').mockRejectedValueOnce(
        new Error('Refresh token invalid')
      );

      await expect(apiClient.get('/protected')).rejects.toThrow();

      expect(tokenStorage.clearTokens).toHaveBeenCalled();
      expect(window.location.href).toBe('/Welcome');
      expect(securityEventReporter.reportAuthRedirect).toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });

    it('clears tokens when refresh response has no access token', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('valid-refresh');

      mock.onGet('/protected').reply(401);

      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: {} }, // No accessToken field
      });

      await expect(apiClient.get('/protected')).rejects.toThrow();

      expect(tokenStorage.clearTokens).toHaveBeenCalled();
      expect(window.location.href).toBe('/Welcome');

      axiosPostSpy.mockRestore();
    });

    it('does NOT retry on second consecutive 401 (_retry flag)', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('expired-token');
      vi.mocked(tokenStorage.getRefreshToken).mockReturnValue('valid-refresh');

      // First call: 401 -> refresh succeeds -> retry also returns 401
      mock.onGet('/protected').reply(() => {
        return [401, { message: 'Unauthorized' }];
      });

      const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { data: { accessToken: 'new-token' } },
      });

      await expect(apiClient.get('/protected')).rejects.toThrow();

      // Refresh was called only once (the retried 401 has _retry=true so no second refresh)
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);

      axiosPostSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // 2d. Non-401 errors
  // -----------------------------------------------------------------------
  describe('Non-401 error handling', () => {
    it('does NOT attempt refresh on 403 errors', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('valid-token');

      mock.onGet('/admin').reply(403, { message: 'Forbidden' });

      const axiosPostSpy = vi.spyOn(axios, 'post');

      await expect(apiClient.get('/admin')).rejects.toThrow();

      // No refresh attempt for 403
      expect(axiosPostSpy).not.toHaveBeenCalled();
      expect(tokenStorage.clearTokens).not.toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });

    it('does NOT attempt refresh on 500 errors', async () => {
      mock.onGet('/broken').reply(500, { message: 'Internal Server Error' });

      const axiosPostSpy = vi.spyOn(axios, 'post');

      await expect(apiClient.get('/broken')).rejects.toThrow();
      expect(axiosPostSpy).not.toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });

    it('does NOT attempt refresh on 404 errors', async () => {
      mock.onGet('/missing').reply(404, { message: 'Not Found' });

      const axiosPostSpy = vi.spyOn(axios, 'post');

      await expect(apiClient.get('/missing')).rejects.toThrow();
      expect(axiosPostSpy).not.toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // 2e. Network errors
  // -----------------------------------------------------------------------
  describe('Network error handling', () => {
    it('dispatches backend-offline CustomEvent on network error', async () => {
      mock.onGet('/health').networkError();

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await expect(apiClient.get('/health')).rejects.toThrow();

      const offlineEvent = dispatchSpy.mock.calls.find(
        ([event]) => event instanceof CustomEvent && event.type === 'backend-offline'
      );
      expect(offlineEvent).toBeDefined();

      dispatchSpy.mockRestore();
    });

    it('sets a user-friendly error message on network error', async () => {
      mock.onGet('/health').networkError();

      try {
        await apiClient.get('/health');
        // Should not reach here
        expect.unreachable('Expected request to throw');
      } catch (err: unknown) {
        const error = err as { message?: string };
        expect(error.message).toContain('Backend server is not running');
      }
    });

    it('does NOT attempt token refresh on network error', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('some-token');
      mock.onGet('/data').networkError();

      const axiosPostSpy = vi.spyOn(axios, 'post');

      await expect(apiClient.get('/data')).rejects.toThrow();
      expect(axiosPostSpy).not.toHaveBeenCalled();

      axiosPostSpy.mockRestore();
    });
  });

  // -----------------------------------------------------------------------
  // 2f. API methods (GET, POST, PATCH, DELETE, PUT)
  // -----------------------------------------------------------------------
  describe('API methods', () => {
    it('get() sends GET request and returns response', async () => {
      mock.onGet('/users').reply(200, { data: [{ id: '1' }] });

      const response = await apiClient.get<Record<string, any>>('/users');
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(1);
    });

    it('post() sends POST request with body', async () => {
      mock.onPost('/users').reply((config) => {
        const body = JSON.parse(config.data);
        return [201, { id: '1', ...body }];
      });

      const response = await apiClient.post('/users', { first_name: 'Alice' });
      expect(response.status).toBe(201);
    });

    it('patch() sends PATCH request with body', async () => {
      mock.onPatch('/users/1').reply((config) => {
        const body = JSON.parse(config.data);
        return [200, { id: '1', ...body }];
      });

      const response = await apiClient.patch('/users/1', { first_name: 'Updated' });
      expect(response.status).toBe(200);
    });

    it('delete() sends DELETE request', async () => {
      mock.onDelete('/users/1').reply(204);

      const response = await apiClient.delete('/users/1');
      expect(response.status).toBe(204);
    });

    it('put() sends PUT request with body', async () => {
      mock.onPut('/users/1').reply(200, { id: '1', first_name: 'Replaced' });

      const response = await apiClient.put('/users/1', { first_name: 'Replaced' });
      expect(response.status).toBe(200);
    });

    it('get() passes custom config (params, headers)', async () => {
      mock.onGet('/search').reply((config) => {
        expect(config.params).toEqual({ q: 'alice' });
        expect(config.headers?.['X-Custom']).toBe('test');
        return [200, { results: [] }];
      });

      await apiClient.get('/search', {
        params: { q: 'alice' },
        headers: { 'X-Custom': 'test' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // 2g. End-to-end interceptor integration
  // -----------------------------------------------------------------------
  describe('End-to-end interceptor integration', () => {
    it('request transforms body keys and response transforms back', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('token-123');

      mock.onPost('/stories').reply((config) => {
        const body = JSON.parse(config.data);
        // Request interceptor should have transformed snake_case -> camelCase
        expect(body.storyTitle).toBe('My Story');
        expect(body.storyContent).toBe('Some content');
        expect(config.headers?.Authorization).toBe('Bearer token-123');

        // Backend responds with camelCase
        return [201, {
          id: '1',
          storyTitle: 'My Story',
          storyContent: 'Some content',
          createdAt: '2024-06-01T00:00:00Z',
        }];
      });

      const response = await apiClient.post<Record<string, any>>('/stories', {
        story_title: 'My Story',
        story_content: 'Some content',
      });

      // Response interceptor transformed to snake_case + aliases
      expect(response.data.story_title).toBe('My Story');
      expect(response.data.created_at).toBe('2024-06-01T00:00:00Z');
      expect(response.data.created_date).toBe('2024-06-01T00:00:00Z');
    });
  });
});
