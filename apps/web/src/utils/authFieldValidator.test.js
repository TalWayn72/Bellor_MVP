import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAuthUserFields, assertSnakeCaseField } from './authFieldValidator';

describe('authFieldValidator', () => {
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('validateAuthUserFields', () => {
    it('returns empty array for null user', () => {
      expect(validateAuthUserFields(null, 'test')).toEqual([]);
    });

    it('returns empty array for undefined user', () => {
      expect(validateAuthUserFields(undefined, 'test')).toEqual([]);
    });

    it('returns empty array when user has correct snake_case fields', () => {
      const user = { id: '1', is_admin: true, first_name: 'John', last_name: 'Doe' };
      const warnings = validateAuthUserFields(user, 'test');
      expect(warnings).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('returns empty array for empty user object', () => {
      const user = {};
      const warnings = validateAuthUserFields(user, 'test');
      expect(warnings).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('detects camelCase field without snake_case equivalent', () => {
      const user = { id: '1', isAdmin: true };
      const warnings = validateAuthUserFields(user, 'TestComponent');
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('isAdmin');
      expect(warnings[0]).toContain('is_admin');
      expect(warnings[0]).toContain('TestComponent');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('does not warn when both camelCase and snake_case exist', () => {
      const user = { id: '1', isAdmin: true, is_admin: true };
      const warnings = validateAuthUserFields(user, 'test');
      expect(warnings).toEqual([]);
    });

    it('detects multiple camelCase mismatches', () => {
      const user = { id: '1', isAdmin: true, firstName: 'John', lastName: 'Doe' };
      const warnings = validateAuthUserFields(user, 'test');
      expect(warnings.length).toBe(3);
    });

    it('detects non-admin camelCase fields like birthDate', () => {
      const user = { id: '1', birthDate: '1990-01-01', createdAt: '2024-01-01' };
      const warnings = validateAuthUserFields(user, 'ProfilePage');
      expect(warnings.length).toBe(2);
      expect(warnings[0]).toContain('birthDate');
      expect(warnings[0]).toContain('birth_date');
      expect(warnings[1]).toContain('createdAt');
      expect(warnings[1]).toContain('created_at');
    });

    it('includes suggestion to check API response interceptor in warning', () => {
      const user = { id: '1', isVerified: true };
      const warnings = validateAuthUserFields(user, 'test');
      expect(warnings[0]).toContain('API transformer');
      expect(warnings[0]).toContain('apiClient response interceptor');
    });

    it('uses "unknown" as default source if not provided', () => {
      const user = { id: '1', isPremium: true };
      const warnings = validateAuthUserFields(user);
      expect(warnings.length).toBe(1);
      // console.warn should be called with source "unknown"
      expect(warnSpy.mock.calls[0][0]).toContain('unknown');
    });

    it('reports warning count in console.warn message', () => {
      const user = { id: '1', isAdmin: true, firstName: 'John' };
      validateAuthUserFields(user, 'test');
      expect(warnSpy.mock.calls[0][0]).toContain('2 field naming issue(s)');
    });

    it('detects notification preference camelCase fields', () => {
      const user = { id: '1', notifyNewMatches: true, notifyEmail: false };
      const warnings = validateAuthUserFields(user, 'Settings');
      expect(warnings.length).toBe(2);
    });

    it('detects privacy/display camelCase fields', () => {
      const user = { id: '1', showOnline: true, privateProfile: false, doNotSell: false };
      const warnings = validateAuthUserFields(user, 'PrivacySettings');
      expect(warnings.length).toBe(3);
    });
  });

  describe('assertSnakeCaseField', () => {
    it('logs error when accessing camelCase field', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'isAdmin', 'ProtectedRoute');
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('isAdmin');
      expect(errorSpy.mock.calls[0][0]).toContain('is_admin');
    });

    it('does not log for snake_case field', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'is_admin', 'ProtectedRoute');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not log for null user', () => {
      assertSnakeCaseField(null, 'isAdmin', 'test');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not log for undefined user', () => {
      assertSnakeCaseField(undefined, 'isAdmin', 'test');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('includes source component name in error message', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'firstName', 'ProfileCard');
      expect(errorSpy.mock.calls[0][0]).toContain('ProfileCard');
    });

    it('suggests correct snake_case equivalent in error', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'lastName', 'EditProfile');
      expect(errorSpy.mock.calls[0][0]).toContain('last_name');
    });

    it('does not log for unknown fields not in the camelCase map', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'unknownField', 'test');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('does not log for simple fields like id or email', () => {
      const user = { id: '1' };
      assertSnakeCaseField(user, 'id', 'test');
      expect(errorSpy).not.toHaveBeenCalled();
      assertSnakeCaseField(user, 'email', 'test');
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
