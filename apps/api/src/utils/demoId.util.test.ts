/**
 * Tests for Demo ID Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import { isDemoUserId, isDemoId, rejectDemoId, DemoIdError } from './demoId.util.js';

describe('[P2][infra] isDemoUserId', () => {
  describe('demo user IDs', () => {
    it('should return true for demo-user-* prefixed IDs', () => {
      expect(isDemoUserId('demo-user-1')).toBe(true);
      expect(isDemoUserId('demo-user-123')).toBe(true);
      expect(isDemoUserId('demo-user-abc')).toBe(true);
    });

    it('should return true for any demo-* prefixed IDs', () => {
      expect(isDemoUserId('demo-match-user-1-romantic')).toBe(true);
      expect(isDemoUserId('demo-discover-1')).toBe(true);
      expect(isDemoUserId('demo-story-user-1')).toBe(true);
    });

    it('should return true for mock-user', () => {
      expect(isDemoUserId('mock-user')).toBe(true);
    });
  });

  describe('real user IDs', () => {
    it('should return false for regular user IDs', () => {
      expect(isDemoUserId('user-123')).toBe(false);
      expect(isDemoUserId('abc123def456')).toBe(false);
      expect(isDemoUserId('cm1234567890')).toBe(false);
    });

    it('should return false for UUID-like IDs', () => {
      expect(isDemoUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null', () => {
      expect(isDemoUserId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDemoUserId(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isDemoUserId('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isDemoUserId('Demo-user-1')).toBe(false);
      expect(isDemoUserId('DEMO-user-1')).toBe(false);
      expect(isDemoUserId('Mock-User')).toBe(false);
    });
  });
});

describe('[P2][infra] isDemoId', () => {
  describe('demo IDs', () => {
    it('should return true for demo-* prefixed IDs', () => {
      expect(isDemoId('demo-chat-1')).toBe(true);
      expect(isDemoId('demo-response-123')).toBe(true);
      expect(isDemoId('demo-notification-abc')).toBe(true);
    });

    it('should return true for mock-user', () => {
      expect(isDemoId('mock-user')).toBe(true);
    });
  });

  describe('real IDs', () => {
    it('should return false for regular IDs', () => {
      expect(isDemoId('chat-123')).toBe(false);
      expect(isDemoId('response-456')).toBe(false);
      expect(isDemoId('cm1234567890')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for null', () => {
      expect(isDemoId(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDemoId(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isDemoId('')).toBe(false);
    });
  });
});

describe('[P2][infra] rejectDemoId', () => {
  describe('demo IDs', () => {
    it('should throw DemoIdError for demo IDs', () => {
      expect(() => rejectDemoId('demo-user-1')).toThrow(DemoIdError);
      expect(() => rejectDemoId('demo-chat-1')).toThrow(DemoIdError);
    });

    it('should throw DemoIdError for mock-user', () => {
      expect(() => rejectDemoId('mock-user')).toThrow(DemoIdError);
    });

    it('should include custom ID type in error message', () => {
      try {
        rejectDemoId('demo-user-1', 'user ID');
      } catch (error) {
        expect(error).toBeInstanceOf(DemoIdError);
        expect((error as DemoIdError).message).toContain('user ID');
        expect((error as DemoIdError).message).toContain('demo-user-1');
      }
    });
  });

  describe('real IDs', () => {
    it('should not throw for regular IDs', () => {
      expect(() => rejectDemoId('user-123')).not.toThrow();
      expect(() => rejectDemoId('chat-456')).not.toThrow();
    });

    it('should not throw for null', () => {
      expect(() => rejectDemoId(null)).not.toThrow();
    });

    it('should not throw for undefined', () => {
      expect(() => rejectDemoId(undefined)).not.toThrow();
    });

    it('should not throw for empty string', () => {
      expect(() => rejectDemoId('')).not.toThrow();
    });
  });
});

describe('[P2][infra] DemoIdError', () => {
  it('should have correct name', () => {
    const error = new DemoIdError('test message');
    expect(error.name).toBe('DemoIdError');
  });

  it('should have correct message', () => {
    const error = new DemoIdError('Cannot perform operation on demo ID');
    expect(error.message).toBe('Cannot perform operation on demo ID');
  });

  it('should be instanceof Error', () => {
    const error = new DemoIdError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be instanceof DemoIdError', () => {
    const error = new DemoIdError('test');
    expect(error).toBeInstanceOf(DemoIdError);
  });
});
