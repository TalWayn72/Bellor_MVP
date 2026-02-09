/**
 * Tests for Security Event Reporter
 * Validates that client-side auth/access events are reported correctly to the backend.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock tokenStorage before importing the module under test
vi.mock('@/api/client/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(),
  },
}));

import {
  reportAuthRedirect,
  reportAdminDenied,
  reportTokenCleared,
  reportAuthCheckFailed,
  reportRenderCrash,
} from './securityEventReporter';
import { tokenStorage } from '@/api/client/tokenStorage';

describe('securityEventReporter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchSpy;
    vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('reportAuthRedirect', () => {
    it('should call API with correct auth_redirect event data', async () => {
      reportAuthRedirect('/dashboard', '/Welcome');

      // Allow the async fire-and-forget call to complete
      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toContain('/security/client-event');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.eventType).toBe('auth_redirect');
      expect(body.attemptedRoute).toBe('/dashboard');
      expect(body.redirectedTo).toBe('/Welcome');
      expect(body.reason).toBe('User not authenticated');
    });

    it('should include timestamp in the event payload', async () => {
      reportAuthRedirect('/profile', '/Welcome');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.timestamp).toBeDefined();

      // Verify timestamp is a valid ISO string
      const parsed = new Date(body.timestamp);
      expect(parsed.toISOString()).toBe(body.timestamp);
    });

    it('should include Authorization header when token exists', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue('test-jwt-token');

      reportAuthRedirect('/settings', '/Welcome');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-jwt-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization header when no token', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockReturnValue(null);

      reportAuthRedirect('/settings', '/Welcome');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('reportAdminDenied', () => {
    it('should call API with admin_denied event', async () => {
      const user = { id: 'user-123', is_admin: false, is_blocked: false };
      reportAdminDenied('/admin', '/feed', user);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.eventType).toBe('admin_denied');
      expect(body.attemptedRoute).toBe('/admin');
      expect(body.redirectedTo).toBe('/feed');
      expect(body.reason).toContain('admin privileges');
      expect(body.userId).toBe('user-123');
    });

    it('should report admin-related field types (not values) for diagnostics', async () => {
      const user = { id: 'u1', is_admin: false, isAdmin: true, role: 'user' };
      reportAdminDenied('/admin', '/feed', user);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      // Boolean values are reported directly
      expect(body.userFields.is_admin).toBe(false);
      expect(body.userFields.isAdmin).toBe(true);
      // Non-boolean values report their type
      expect(body.userFields.role).toBe('string');
      // field_keys lists admin-related keys
      expect(body.userFields.field_keys).toContain('is_admin');
      expect(body.userFields.field_keys).toContain('isAdmin');
    });

    it('should handle null user gracefully', async () => {
      reportAdminDenied('/admin', '/feed', null);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.eventType).toBe('admin_denied');
      expect(body.userId).toBeUndefined();
      // userFields should be empty object (no user to inspect)
      expect(body.userFields).toEqual({});
    });

    it('should only include admin/Admin related keys in field_keys', async () => {
      const user = {
        id: 'u1',
        email: 'test@test.com',
        is_admin: true,
        superAdmin: false,
        name: 'Test',
      };
      reportAdminDenied('/admin', '/feed', user);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userFields.field_keys).toContain('is_admin');
      expect(body.userFields.field_keys).toContain('superAdmin');
      expect(body.userFields.field_keys).not.toContain('email');
      expect(body.userFields.field_keys).not.toContain('name');
    });
  });

  describe('reportTokenCleared', () => {
    it('should call API with token_cleared event', async () => {
      reportTokenCleared('apiClient', 'Refresh token expired');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.eventType).toBe('token_cleared');
      expect(body.attemptedRoute).toBe('apiClient');
      expect(body.redirectedTo).toBe('/Welcome');
      expect(body.reason).toBe('Refresh token expired');
    });
  });

  describe('reportAuthCheckFailed', () => {
    it('should call API with auth_check_failed event', async () => {
      reportAuthCheckFailed('UserProvider');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.eventType).toBe('auth_check_failed');
      expect(body.attemptedRoute).toBe('UserProvider');
      expect(body.redirectedTo).toBe('none');
      expect(body.reason).toBe('Auth check failed');
    });

    it('should include HTTP status code in reason when provided', async () => {
      reportAuthCheckFailed('UserProvider', 401);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.reason).toBe('Auth check failed (HTTP 401)');
    });

    it('should include HTTP status code for 403', async () => {
      reportAuthCheckFailed('ProtectedRoute', 403);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.reason).toBe('Auth check failed (HTTP 403)');
    });
  });

  describe('reportRenderCrash', () => {
    it('should call API with render_crash event data', async () => {
      reportRenderCrash('/profile', 'Cannot read property of null');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.eventType).toBe('render_crash');
      expect(body.attemptedRoute).toBe('/profile');
      expect(body.redirectedTo).toBe('error_boundary');
      expect(body.reason).toBe('Cannot read property of null');
    });

    it('should include componentStack in userFields when provided', async () => {
      const stack = 'at ProfilePage\n  at ProtectedRoute\n  at App';
      reportRenderCrash('/profile', 'Render error', stack);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userFields).toBeDefined();
      expect(body.userFields.componentStack).toBe(stack);
    });

    it('should truncate componentStack to 500 characters', async () => {
      const longStack = 'a'.repeat(1000);
      reportRenderCrash('/profile', 'Render error', longStack);

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userFields.componentStack.length).toBe(500);
    });

    it('should not include userFields when componentStack is not provided', async () => {
      reportRenderCrash('/feed', 'Unexpected error');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.userFields).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should not throw when fetch fails with network error', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      // Should not throw
      expect(() => {
        reportAuthRedirect('/dashboard', '/Welcome');
      }).not.toThrow();

      // Wait a tick for the async rejection to be caught
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    it('should not throw when fetch returns non-ok response', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500 });

      expect(() => {
        reportTokenCleared('test', 'test reason');
      }).not.toThrow();

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('should not throw when tokenStorage.getAccessToken throws', async () => {
      vi.mocked(tokenStorage.getAccessToken).mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // The entire reportEvent is wrapped in try/catch, so this should not throw
      expect(() => {
        reportAuthRedirect('/dashboard', '/Welcome');
      }).not.toThrow();

      // Wait a tick for the async call to settle
      await new Promise(resolve => setTimeout(resolve, 50));
    });
  });

  describe('API endpoint', () => {
    it('should POST to /security/client-event endpoint', async () => {
      reportAuthRedirect('/test', '/Welcome');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const url = fetchSpy.mock.calls[0][0];
      expect(url).toMatch(/\/security\/client-event$/);
    });

    it('should always set Content-Type to application/json', async () => {
      reportAuthRedirect('/test', '/Welcome');

      await vi.waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
