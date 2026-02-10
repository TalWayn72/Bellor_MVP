/**
 * Tests for API Validation Utilities
 * @module api/utils/validation.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateUserId,
  validateRequiredId,
  validateDataObject,
  validateRequiredParams,
} from './validation';

describe('[P0][safety] validation utilities', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validateUserId', () => {
    it('should not throw for valid userId', () => {
      expect(() => validateUserId('user-123', 'testFunc')).not.toThrow();
      expect(() => validateUserId('abc-def-ghi', 'testFunc')).not.toThrow();
      expect(() => validateUserId('12345', 'testFunc')).not.toThrow();
    });

    it('should throw for undefined userId', () => {
      expect(() => validateUserId(undefined, 'testFunc')).toThrow(
        'Invalid user ID: userId is required for testFunc'
      );
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw for null userId', () => {
      expect(() => validateUserId(null, 'testFunc')).toThrow(
        'Invalid user ID: userId is required for testFunc'
      );
    });

    it('should throw for empty string userId', () => {
      expect(() => validateUserId('', 'testFunc')).toThrow(
        'Invalid user ID: userId is required for testFunc'
      );
    });

    it('should throw for string "undefined"', () => {
      expect(() => validateUserId('undefined', 'testFunc')).toThrow(
        'Invalid user ID: "undefined" is not a valid ID for testFunc'
      );
    });

    it('should throw for string "null"', () => {
      expect(() => validateUserId('null', 'testFunc')).toThrow(
        'Invalid user ID: "null" is not a valid ID for testFunc'
      );
    });

    it('should throw for number userId', () => {
      expect(() => validateUserId(123, 'testFunc')).toThrow(
        'Invalid user ID: expected string, got number for testFunc'
      );
    });

    it('should throw for object userId', () => {
      expect(() => validateUserId({ id: '123' }, 'testFunc')).toThrow(
        'Invalid user ID: expected string, got object for testFunc'
      );
    });

    it('should throw for array userId', () => {
      expect(() => validateUserId(['123'], 'testFunc')).toThrow(
        'Invalid user ID: expected string, got object for testFunc'
      );
    });

    it('should use default caller name when not provided', () => {
      expect(() => validateUserId(undefined)).toThrow(
        'Invalid user ID: userId is required for API call'
      );
    });
  });

  describe('validateRequiredId', () => {
    it('should not throw for valid ID', () => {
      expect(() => validateRequiredId('chat-123', 'chatId', 'testFunc')).not.toThrow();
      expect(() => validateRequiredId('response-456', 'responseId', 'testFunc')).not.toThrow();
    });

    it('should throw for undefined ID', () => {
      expect(() => validateRequiredId(undefined, 'chatId', 'testFunc')).toThrow(
        'Invalid chatId: chatId is required for testFunc'
      );
    });

    it('should throw for null ID', () => {
      expect(() => validateRequiredId(null, 'responseId', 'testFunc')).toThrow(
        'Invalid responseId: responseId is required for testFunc'
      );
    });

    it('should throw for empty string ID', () => {
      expect(() => validateRequiredId('', 'notificationId', 'testFunc')).toThrow(
        'Invalid notificationId: notificationId is required for testFunc'
      );
    });

    it('should throw for string "undefined"', () => {
      expect(() => validateRequiredId('undefined', 'storyId', 'testFunc')).toThrow(
        'Invalid storyId: "undefined" is not a valid ID for testFunc'
      );
    });

    it('should throw for string "null"', () => {
      expect(() => validateRequiredId('null', 'messageId', 'testFunc')).toThrow(
        'Invalid messageId: "null" is not a valid ID for testFunc'
      );
    });

    it('should use default caller name when not provided', () => {
      expect(() => validateRequiredId(undefined, 'testId')).toThrow(
        'Invalid testId: testId is required for API call'
      );
    });
  });

  describe('validateDataObject', () => {
    it('should not throw for valid object', () => {
      expect(() => validateDataObject({}, 'testFunc')).not.toThrow();
      expect(() => validateDataObject({ key: 'value' }, 'testFunc')).not.toThrow();
      expect(() => validateDataObject({ nested: { data: true } }, 'testFunc')).not.toThrow();
    });

    it('should not throw for array (arrays are objects)', () => {
      expect(() => validateDataObject([], 'testFunc')).not.toThrow();
      expect(() => validateDataObject([1, 2, 3], 'testFunc')).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => validateDataObject(null, 'testFunc')).toThrow(
        'Invalid data: must be an object for testFunc'
      );
    });

    it('should throw for undefined', () => {
      expect(() => validateDataObject(undefined, 'testFunc')).toThrow(
        'Invalid data: must be an object for testFunc'
      );
    });

    it('should throw for string', () => {
      expect(() => validateDataObject('string data', 'testFunc')).toThrow(
        'Invalid data: must be an object for testFunc'
      );
    });

    it('should throw for number', () => {
      expect(() => validateDataObject(123, 'testFunc')).toThrow(
        'Invalid data: must be an object for testFunc'
      );
    });

    it('should throw for boolean', () => {
      expect(() => validateDataObject(true, 'testFunc')).toThrow(
        'Invalid data: must be an object for testFunc'
      );
    });

    it('should use default caller name when not provided', () => {
      expect(() => validateDataObject(null)).toThrow(
        'Invalid data: must be an object for API call'
      );
    });
  });

  describe('validateRequiredParams', () => {
    it('should not throw for valid params', () => {
      expect(() =>
        validateRequiredParams(
          { userId: 'user-123', chatId: 'chat-456' },
          'testFunc'
        )
      ).not.toThrow();
    });

    it('should throw for undefined param', () => {
      expect(() =>
        validateRequiredParams({ userId: undefined }, 'testFunc')
      ).toThrow('Missing required parameter: userId for testFunc');
    });

    it('should throw for null param', () => {
      expect(() =>
        validateRequiredParams({ chatId: null }, 'testFunc')
      ).toThrow('Missing required parameter: chatId for testFunc');
    });

    it('should throw for empty string param', () => {
      expect(() =>
        validateRequiredParams({ responseId: '' }, 'testFunc')
      ).toThrow('Missing required parameter: responseId for testFunc');
    });

    it('should throw for string "undefined"', () => {
      expect(() =>
        validateRequiredParams({ userId: 'undefined' }, 'testFunc')
      ).toThrow('Invalid userId: "undefined" is not valid for testFunc');
    });

    it('should throw for string "null"', () => {
      expect(() =>
        validateRequiredParams({ chatId: 'null' }, 'testFunc')
      ).toThrow('Invalid chatId: "null" is not valid for testFunc');
    });

    it('should validate multiple params and throw on first invalid', () => {
      expect(() =>
        validateRequiredParams(
          { userId: 'valid', chatId: undefined, messageId: 'valid' },
          'testFunc'
        )
      ).toThrow('Missing required parameter: chatId for testFunc');
    });

    it('should use default caller name when not provided', () => {
      expect(() =>
        validateRequiredParams({ testId: undefined })
      ).toThrow('Missing required parameter: testId for API call');
    });
  });

  describe('integration scenarios', () => {
    it('should catch common undefined ID patterns', () => {
      // Simulating common bug patterns
      const user = {}; // user object without id property
      expect(() => validateUserId(user.id, 'updateUser')).toThrow();

      const authUser = null;
      expect(() => validateUserId(authUser?.id, 'getUserProfile')).toThrow();

      const response = { user_id: undefined };
      expect(() => validateUserId(response.user_id, 'fetchUser')).toThrow();
    });

    it('should catch URL interpolation bugs', () => {
      // These would cause URLs like /users/undefined
      const userId = undefined;
      expect(() => validateUserId(userId, 'getUserById')).toThrow();

      // These would cause URLs like /users/null
      const nullId = null;
      expect(() => validateUserId(nullId, 'updateUser')).toThrow();

      // These would cause URLs like /users/[object Object]
      const objectId = { id: '123' };
      expect(() => validateUserId(objectId, 'deleteUser')).toThrow();
    });

    it('should handle demo user IDs correctly', () => {
      // Demo user IDs should be valid strings
      expect(() => validateUserId('demo-user-1', 'getUser')).not.toThrow();
      expect(() => validateUserId('demo-match-user-1-romantic', 'getUser')).not.toThrow();
    });

    it('should handle UUID-style IDs', () => {
      expect(() =>
        validateUserId('550e8400-e29b-41d4-a716-446655440000', 'getUser')
      ).not.toThrow();
    });

    it('should handle CUID-style IDs', () => {
      expect(() =>
        validateUserId('clh1234567890abcdefghij', 'getUser')
      ).not.toThrow();
    });
  });
});
