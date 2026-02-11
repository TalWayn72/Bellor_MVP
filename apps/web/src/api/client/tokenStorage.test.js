/**
 * Token Storage Test Suite
 * Verifies that tokenStorage dispatches custom events correctly
 * for cross-module communication (e.g., AuthContext sync).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenStorage } from './tokenStorage';

describe('[P0][auth] tokenStorage - event dispatching', () => {
  let dispatchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    // Spy on window.dispatchEvent
    dispatchSpy = vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  describe('setAccessToken', () => {
    it('should store the token in localStorage', () => {
      tokenStorage.setAccessToken('test-token-abc');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bellor_access_token',
        'test-token-abc'
      );
    });

    it('should dispatch bellor-token-refreshed event', () => {
      tokenStorage.setAccessToken('my-token');

      expect(dispatchSpy).toHaveBeenCalledOnce();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('bellor-token-refreshed');
    });

    it('should NOT dispatch event when silent option is true', () => {
      tokenStorage.setAccessToken('silent-token', { silent: true });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bellor_access_token',
        'silent-token'
      );
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should dispatch event when silent option is false', () => {
      tokenStorage.setAccessToken('loud-token', { silent: false });

      expect(dispatchSpy).toHaveBeenCalledOnce();
      expect(dispatchSpy.mock.calls[0][0].type).toBe('bellor-token-refreshed');
    });

    it('should dispatch event when options is empty object', () => {
      tokenStorage.setAccessToken('default-token', {});

      expect(dispatchSpy).toHaveBeenCalledOnce();
      expect(dispatchSpy.mock.calls[0][0].type).toBe('bellor-token-refreshed');
    });
  });

  describe('clearTokens', () => {
    it('should remove all token keys from localStorage', () => {
      tokenStorage.clearTokens();

      expect(localStorage.removeItem).toHaveBeenCalledWith('bellor_access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('bellor_refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('bellor_user');
    });

    it('should dispatch bellor-tokens-cleared event', () => {
      tokenStorage.clearTokens();

      expect(dispatchSpy).toHaveBeenCalledOnce();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('bellor-tokens-cleared');
    });
  });

  describe('setTokens', () => {
    it('should set both access and refresh tokens', () => {
      tokenStorage.setTokens('access-123', 'refresh-456');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bellor_access_token',
        'access-123'
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'bellor_refresh_token',
        'refresh-456'
      );
    });

    it('should dispatch bellor-token-refreshed for access token', () => {
      tokenStorage.setTokens('access-new', 'refresh-new');

      const refreshEvents = dispatchSpy.mock.calls.filter(
        (call) => call[0].type === 'bellor-token-refreshed'
      );
      expect(refreshEvents.length).toBe(1);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      localStorage.getItem.mockReturnValue('valid-token');
      expect(tokenStorage.isAuthenticated()).toBe(true);
    });

    it('should return false when no access token', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(tokenStorage.isAuthenticated()).toBe(false);
    });
  });
});
