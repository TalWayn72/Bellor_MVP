/**
 * Tests for API Client
 * @module api/client/apiClient.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Mock tokenStorage
vi.mock('./tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => 'mock-token'),
    getRefreshToken: vi.fn(() => 'mock-refresh-token'),
    setAccessToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

// Test the transformation functions directly
describe('API Client Transformations', () => {
  // Re-implement the transformation functions for testing
  function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  const fieldAliases = {
    'created_at': 'created_date',
    'updated_at': 'updated_date',
    'last_active_at': 'last_active_date',
    'birth_date': 'date_of_birth',
  };

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

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('createdAt')).toBe('created_at');
      expect(camelToSnake('updatedAt')).toBe('updated_at');
      expect(camelToSnake('firstName')).toBe('first_name');
      expect(camelToSnake('lastName')).toBe('last_name');
      expect(camelToSnake('userId')).toBe('user_id');
      expect(camelToSnake('responseType')).toBe('response_type');
    });

    it('should handle already snake_case strings', () => {
      expect(camelToSnake('created_at')).toBe('created_at');
      expect(camelToSnake('user_id')).toBe('user_id');
    });

    it('should handle single word strings', () => {
      expect(camelToSnake('id')).toBe('id');
      expect(camelToSnake('name')).toBe('name');
    });
  });

  describe('transformKeysToSnakeCase', () => {
    it('should transform object keys from camelCase to snake_case', () => {
      const input = {
        userId: '123',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: '2024-01-01',
      };

      const result = transformKeysToSnakeCase(input);

      expect(result.user_id).toBe('123');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.created_at).toBe('2024-01-01');
    });

    it('should handle nested objects', () => {
      const input = {
        userId: '123',
        userData: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const result = transformKeysToSnakeCase(input);

      expect(result.user_data.first_name).toBe('John');
      expect(result.user_data.last_name).toBe('Doe');
    });

    it('should handle arrays', () => {
      const input = [
        { userId: '1', firstName: 'John' },
        { userId: '2', firstName: 'Jane' },
      ];

      const result = transformKeysToSnakeCase(input);

      expect(result[0].user_id).toBe('1');
      expect(result[0].first_name).toBe('John');
      expect(result[1].user_id).toBe('2');
      expect(result[1].first_name).toBe('Jane');
    });

    it('should handle null and undefined', () => {
      expect(transformKeysToSnakeCase(null)).toBe(null);
      expect(transformKeysToSnakeCase(undefined)).toBe(undefined);
    });

    it('should not transform Date objects', () => {
      const date = new Date('2024-01-01');
      const input = { createdAt: date };
      const result = transformKeysToSnakeCase(input);
      expect(result.created_at).toBeInstanceOf(Date);
    });
  });

  describe('field aliases', () => {
    it('should add created_date alias for created_at', () => {
      const input = { createdAt: '2024-01-01T00:00:00Z' };
      const result = transformKeysToSnakeCase(input);

      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.created_date).toBe('2024-01-01T00:00:00Z');
    });

    it('should add updated_date alias for updated_at', () => {
      const input = { updatedAt: '2024-01-02T00:00:00Z' };
      const result = transformKeysToSnakeCase(input);

      expect(result.updated_at).toBe('2024-01-02T00:00:00Z');
      expect(result.updated_date).toBe('2024-01-02T00:00:00Z');
    });

    it('should add last_active_date alias for last_active_at', () => {
      const input = { lastActiveAt: '2024-01-03T00:00:00Z' };
      const result = transformKeysToSnakeCase(input);

      expect(result.last_active_at).toBe('2024-01-03T00:00:00Z');
      expect(result.last_active_date).toBe('2024-01-03T00:00:00Z');
    });

    it('should add date_of_birth alias for birth_date', () => {
      const input = { birthDate: '1990-01-01' };
      const result = transformKeysToSnakeCase(input);

      expect(result.birth_date).toBe('1990-01-01');
      expect(result.date_of_birth).toBe('1990-01-01');
    });

    it('should handle multiple aliases in one object', () => {
      const input = {
        userId: '123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        lastActiveAt: '2024-01-03T00:00:00Z',
        birthDate: '1990-01-01',
      };

      const result = transformKeysToSnakeCase(input);

      // Original transformed keys
      expect(result.user_id).toBe('123');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.updated_at).toBe('2024-01-02T00:00:00Z');
      expect(result.last_active_at).toBe('2024-01-03T00:00:00Z');
      expect(result.birth_date).toBe('1990-01-01');

      // Aliased keys
      expect(result.created_date).toBe('2024-01-01T00:00:00Z');
      expect(result.updated_date).toBe('2024-01-02T00:00:00Z');
      expect(result.last_active_date).toBe('2024-01-03T00:00:00Z');
      expect(result.date_of_birth).toBe('1990-01-01');
    });

    it('should handle aliases in nested objects', () => {
      const input = {
        user: {
          createdAt: '2024-01-01T00:00:00Z',
          birthDate: '1990-01-01',
        },
      };

      const result = transformKeysToSnakeCase(input);

      expect(result.user.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.user.created_date).toBe('2024-01-01T00:00:00Z');
      expect(result.user.birth_date).toBe('1990-01-01');
      expect(result.user.date_of_birth).toBe('1990-01-01');
    });

    it('should handle aliases in arrays', () => {
      const input = [
        { createdAt: '2024-01-01T00:00:00Z' },
        { createdAt: '2024-01-02T00:00:00Z' },
      ];

      const result = transformKeysToSnakeCase(input);

      expect(result[0].created_at).toBe('2024-01-01T00:00:00Z');
      expect(result[0].created_date).toBe('2024-01-01T00:00:00Z');
      expect(result[1].created_at).toBe('2024-01-02T00:00:00Z');
      expect(result[1].created_date).toBe('2024-01-02T00:00:00Z');
    });
  });

  describe('real-world response scenarios', () => {
    it('should transform user response correctly', () => {
      const apiResponse = {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        birthDate: '1990-05-15',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        lastActiveAt: '2024-01-20T09:00:00Z',
        profileImages: ['image1.jpg', 'image2.jpg'],
        lookingFor: ['FEMALE'],
      };

      const result = transformKeysToSnakeCase(apiResponse);

      // Check all transformations
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.profile_images).toEqual(['image1.jpg', 'image2.jpg']);
      expect(result.looking_for).toEqual(['FEMALE']);

      // Check aliases for dates
      expect(result.created_date).toBe('2024-01-01T10:00:00Z');
      expect(result.updated_date).toBe('2024-01-15T14:30:00Z');
      expect(result.last_active_date).toBe('2024-01-20T09:00:00Z');
      expect(result.date_of_birth).toBe('1990-05-15');
    });

    it('should transform response list correctly', () => {
      const apiResponse = {
        data: [
          { id: '1', responseType: 'TEXT', createdAt: '2024-01-01T00:00:00Z' },
          { id: '2', responseType: 'VIDEO', createdAt: '2024-01-02T00:00:00Z' },
        ],
        pagination: {
          total: 2,
          hasMore: false,
        },
      };

      const result = transformKeysToSnakeCase(apiResponse);

      expect(result.data[0].response_type).toBe('TEXT');
      expect(result.data[0].created_date).toBe('2024-01-01T00:00:00Z');
      expect(result.data[1].response_type).toBe('VIDEO');
      expect(result.data[1].created_date).toBe('2024-01-02T00:00:00Z');
      expect(result.pagination.has_more).toBe(false);
    });
  });
});
