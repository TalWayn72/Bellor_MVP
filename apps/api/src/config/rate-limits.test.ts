/**
 * Tests for Rate Limits Configuration
 * Validates structure, categories, and value constraints
 */

import { describe, it, expect } from 'vitest';
import { RATE_LIMITS } from './rate-limits.js';

describe('RATE_LIMITS', () => {
  describe('categories exist', () => {
    it('should have default rate limit', () => {
      expect(RATE_LIMITS.default).toBeDefined();
    });

    it('should have auth rate limits', () => {
      expect(RATE_LIMITS.auth).toBeDefined();
    });

    it('should have chat rate limits', () => {
      expect(RATE_LIMITS.chat).toBeDefined();
    });

    it('should have search rate limits', () => {
      expect(RATE_LIMITS.search).toBeDefined();
    });

    it('should have upload rate limits', () => {
      expect(RATE_LIMITS.upload).toBeDefined();
    });
  });

  describe('default rate limit', () => {
    it('should have max and timeWindow', () => {
      expect(RATE_LIMITS.default.max).toBeDefined();
      expect(RATE_LIMITS.default.timeWindow).toBeDefined();
    });

    it('should have positive max value', () => {
      expect(RATE_LIMITS.default.max).toBeGreaterThan(0);
    });

    it('should have a string timeWindow', () => {
      expect(typeof RATE_LIMITS.default.timeWindow).toBe('string');
      expect(RATE_LIMITS.default.timeWindow.length).toBeGreaterThan(0);
    });
  });

  describe('auth rate limits', () => {
    it('should have login limits', () => {
      expect(RATE_LIMITS.auth.login).toBeDefined();
      expect(RATE_LIMITS.auth.login.max).toBeDefined();
      expect(RATE_LIMITS.auth.login.timeWindow).toBeDefined();
    });

    it('should have register limits', () => {
      expect(RATE_LIMITS.auth.register).toBeDefined();
      expect(RATE_LIMITS.auth.register.max).toBeDefined();
      expect(RATE_LIMITS.auth.register.timeWindow).toBeDefined();
    });

    it('should have passwordReset limits', () => {
      expect(RATE_LIMITS.auth.passwordReset).toBeDefined();
      expect(RATE_LIMITS.auth.passwordReset.max).toBeDefined();
      expect(RATE_LIMITS.auth.passwordReset.timeWindow).toBeDefined();
    });

    it('should have login max stricter than default', () => {
      expect(RATE_LIMITS.auth.login.max).toBeLessThan(RATE_LIMITS.default.max);
    });

    it('should have register max stricter than default', () => {
      expect(RATE_LIMITS.auth.register.max).toBeLessThan(RATE_LIMITS.default.max);
    });

    it('should have passwordReset max stricter than default', () => {
      expect(RATE_LIMITS.auth.passwordReset.max).toBeLessThan(RATE_LIMITS.default.max);
    });

    it('should have positive max values for all auth limits', () => {
      expect(RATE_LIMITS.auth.login.max).toBeGreaterThan(0);
      expect(RATE_LIMITS.auth.register.max).toBeGreaterThan(0);
      expect(RATE_LIMITS.auth.passwordReset.max).toBeGreaterThan(0);
    });
  });

  describe('chat rate limits', () => {
    it('should have sendMessage limits', () => {
      expect(RATE_LIMITS.chat.sendMessage).toBeDefined();
      expect(RATE_LIMITS.chat.sendMessage.max).toBeDefined();
      expect(RATE_LIMITS.chat.sendMessage.timeWindow).toBeDefined();
    });

    it('should have positive max for sendMessage', () => {
      expect(RATE_LIMITS.chat.sendMessage.max).toBeGreaterThan(0);
    });

    it('should have a string timeWindow for sendMessage', () => {
      expect(typeof RATE_LIMITS.chat.sendMessage.timeWindow).toBe('string');
    });
  });

  describe('search rate limits', () => {
    it('should have users search limits', () => {
      expect(RATE_LIMITS.search.users).toBeDefined();
      expect(RATE_LIMITS.search.users.max).toBeDefined();
      expect(RATE_LIMITS.search.users.timeWindow).toBeDefined();
    });

    it('should have positive max for users search', () => {
      expect(RATE_LIMITS.search.users.max).toBeGreaterThan(0);
    });

    it('should have a string timeWindow for users search', () => {
      expect(typeof RATE_LIMITS.search.users.timeWindow).toBe('string');
    });
  });

  describe('upload rate limits', () => {
    it('should have files upload limits', () => {
      expect(RATE_LIMITS.upload.files).toBeDefined();
      expect(RATE_LIMITS.upload.files.max).toBeDefined();
      expect(RATE_LIMITS.upload.files.timeWindow).toBeDefined();
    });

    it('should have positive max for file uploads', () => {
      expect(RATE_LIMITS.upload.files.max).toBeGreaterThan(0);
    });

    it('should have a string timeWindow for file uploads', () => {
      expect(typeof RATE_LIMITS.upload.files.timeWindow).toBe('string');
    });
  });

  describe('all entries have valid structure', () => {
    it('should have max as a number for all flat rate limits', () => {
      expect(typeof RATE_LIMITS.default.max).toBe('number');
      expect(typeof RATE_LIMITS.chat.sendMessage.max).toBe('number');
      expect(typeof RATE_LIMITS.search.users.max).toBe('number');
      expect(typeof RATE_LIMITS.upload.files.max).toBe('number');
    });

    it('should have max as a number for all auth rate limits', () => {
      expect(typeof RATE_LIMITS.auth.login.max).toBe('number');
      expect(typeof RATE_LIMITS.auth.register.max).toBe('number');
      expect(typeof RATE_LIMITS.auth.passwordReset.max).toBe('number');
    });

    it('should have timeWindow as a string for all flat rate limits', () => {
      expect(typeof RATE_LIMITS.default.timeWindow).toBe('string');
      expect(typeof RATE_LIMITS.chat.sendMessage.timeWindow).toBe('string');
      expect(typeof RATE_LIMITS.search.users.timeWindow).toBe('string');
      expect(typeof RATE_LIMITS.upload.files.timeWindow).toBe('string');
    });

    it('should have timeWindow as a string for all auth rate limits', () => {
      expect(typeof RATE_LIMITS.auth.login.timeWindow).toBe('string');
      expect(typeof RATE_LIMITS.auth.register.timeWindow).toBe('string');
      expect(typeof RATE_LIMITS.auth.passwordReset.timeWindow).toBe('string');
    });
  });

  describe('value constraints', () => {
    it('should have all max values as positive integers', () => {
      const allMaxValues = [
        RATE_LIMITS.default.max,
        RATE_LIMITS.auth.login.max,
        RATE_LIMITS.auth.register.max,
        RATE_LIMITS.auth.passwordReset.max,
        RATE_LIMITS.chat.sendMessage.max,
        RATE_LIMITS.search.users.max,
        RATE_LIMITS.upload.files.max,
      ];

      for (const max of allMaxValues) {
        expect(max).toBeGreaterThan(0);
        expect(Number.isInteger(max)).toBe(true);
      }
    });

    it('should have all timeWindow values as non-empty strings', () => {
      const allTimeWindows = [
        RATE_LIMITS.default.timeWindow,
        RATE_LIMITS.auth.login.timeWindow,
        RATE_LIMITS.auth.register.timeWindow,
        RATE_LIMITS.auth.passwordReset.timeWindow,
        RATE_LIMITS.chat.sendMessage.timeWindow,
        RATE_LIMITS.search.users.timeWindow,
        RATE_LIMITS.upload.files.timeWindow,
      ];

      for (const tw of allTimeWindows) {
        expect(typeof tw).toBe('string');
        expect(tw.length).toBeGreaterThan(0);
      }
    });

    it('should have auth limits strictly less than default max', () => {
      const authMaxValues = [
        RATE_LIMITS.auth.login.max,
        RATE_LIMITS.auth.register.max,
        RATE_LIMITS.auth.passwordReset.max,
      ];

      for (const max of authMaxValues) {
        expect(max).toBeLessThan(RATE_LIMITS.default.max);
      }
    });
  });
});
