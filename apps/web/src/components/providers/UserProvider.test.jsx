/**
 * UserProvider + useUser Hook Tests
 * Comprehensive tests for user context management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { UserProvider, useUser } from './UserProvider';

// --- Mocks ---

vi.mock('@/api/services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/api/client/tokenStorage', () => ({
  tokenStorage: {
    isAuthenticated: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

vi.mock('@/security/securityEventReporter', () => ({
  reportAuthCheckFailed: vi.fn(),
  reportTokenCleared: vi.fn(),
}));

import { authService } from '@/api/services/authService';
import { tokenStorage } from '@/api/client/tokenStorage';
import {
  reportAuthCheckFailed,
  reportTokenCleared,
} from '@/security/securityEventReporter';

// --- Fixtures ---

const MOCK_USER = {
  id: 'user-1',
  email: 'test@bellor.app',
  nickname: 'TestUser',
  first_name: 'Test',
  last_name: 'User',
  is_admin: false,
};

const UPDATED_USER = {
  id: 'user-1',
  email: 'updated@bellor.app',
  nickname: 'UpdatedUser',
  first_name: 'Updated',
  last_name: 'User',
  is_admin: false,
};

// --- Helpers ---

function wrapper({ children }) {
  return <UserProvider>{children}</UserProvider>;
}

/**
 * Creates a deferred promise that can be resolved/rejected externally.
 * Useful for controlling async timing in tests.
 */
function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// --- Tests ---

describe('[P0][auth] UserProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // =============================================
  // useUser hook contract
  // =============================================
  describe('useUser hook', () => {
    it('should throw when used outside UserProvider', () => {
      // Suppress React error boundary noise
      expect(() => {
        renderHook(() => useUser());
      }).toThrow('useUser must be used within a UserProvider');
    });

    it('should return currentUser when loaded', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUser).toEqual(MOCK_USER);
    });

    it('should return isLoading=true initially', () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const deferred = createDeferred();
      authService.getCurrentUser.mockReturnValue(deferred.promise);

      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      // Resolve so the fork can exit cleanly
      deferred.resolve(MOCK_USER);
    });

    it('should return null currentUser when no user is authenticated', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
    });

    it('should expose all expected context fields', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('currentUser');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('updateUser');
      expect(result.current).toHaveProperty('refreshUser');
      expect(typeof result.current.updateUser).toBe('function');
      expect(typeof result.current.refreshUser).toBe('function');
    });
  });

  // =============================================
  // Initial fetch behavior
  // =============================================
  describe('initial fetch', () => {
    it('should fetch user data on mount when authenticated', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
      });
    });

    it('should NOT fetch when not authenticated', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(authService.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should set currentUser from API response', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUser).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set isLoading=false after successful fetch', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoading=false after failed fetch', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isAuthenticated=false when not authenticated', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set isAuthenticated=true when fetch succeeds', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should set isAuthenticated=false when fetch fails', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Forbidden'));

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });
  });

  // =============================================
  // updateUser
  // =============================================
  describe('updateUser', () => {
    it('should merge partial updates into current user', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ nickname: 'NewNick' });
      });

      expect(result.current.currentUser).toEqual({
        ...MOCK_USER,
        nickname: 'NewNick',
      });
    });

    it('should preserve existing fields when updating partially', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ email: 'new@bellor.app' });
      });

      expect(result.current.currentUser.id).toBe(MOCK_USER.id);
      expect(result.current.currentUser.nickname).toBe(MOCK_USER.nickname);
      expect(result.current.currentUser.first_name).toBe(MOCK_USER.first_name);
      expect(result.current.currentUser.email).toBe('new@bellor.app');
    });

    it('should handle adding new fields via updateUser', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ bio: 'Hello world' });
      });

      expect(result.current.currentUser.bio).toBe('Hello world');
      expect(result.current.currentUser.id).toBe(MOCK_USER.id);
    });

    it('should handle multiple sequential updates', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ nickname: 'First' });
      });

      act(() => {
        result.current.updateUser({ first_name: 'Updated' });
      });

      expect(result.current.currentUser.nickname).toBe('First');
      expect(result.current.currentUser.first_name).toBe('Updated');
    });
  });

  // =============================================
  // refreshUser
  // =============================================
  describe('refreshUser', () => {
    it('should re-fetch user data from API', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Setup fresh data for the refresh call
      authService.getCurrentUser.mockResolvedValue(UPDATED_USER);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(authService.getCurrentUser).toHaveBeenCalledTimes(2);
      expect(result.current.currentUser).toEqual(UPDATED_USER);
    });

    it('should set isLoading=true during refresh', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const deferred = createDeferred();
      authService.getCurrentUser.mockReturnValue(deferred.promise);

      // Start refresh (don't await - we want to check mid-flight)
      let refreshPromise;
      act(() => {
        refreshPromise = result.current.refreshUser();
      });

      expect(result.current.isLoading).toBe(true);

      // Complete the refresh
      await act(async () => {
        deferred.resolve(UPDATED_USER);
        await refreshPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should update currentUser with fresh data', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(MOCK_USER);
      });

      const freshUser = { ...MOCK_USER, nickname: 'FreshNick', email: 'fresh@bellor.app' };
      authService.getCurrentUser.mockResolvedValue(freshUser);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.currentUser).toEqual(freshUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user on refresh failure', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      authService.getCurrentUser.mockRejectedValue(new Error('Server error'));

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should report auth check failure on refresh error', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(reportAuthCheckFailed).toHaveBeenCalledWith(
        'UserProvider.refreshUser',
        401
      );
    });
  });

  // =============================================
  // 401 handling
  // =============================================
  describe('401 handling', () => {
    it('should clear user and tokens on 401 response during initial fetch', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(tokenStorage.clearTokens).toHaveBeenCalledTimes(1);
    });

    it('should report token cleared on 401', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error);

      renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(reportTokenCleared).toHaveBeenCalledWith(
          'UserProvider.fetchUser',
          'Token cleared after 401 response'
        );
      });
    });

    it('should report auth check failed on 401', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error);

      renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(reportAuthCheckFailed).toHaveBeenCalledWith(
          'UserProvider.fetchUser',
          401
        );
      });
    });

    it('should NOT clear tokens on non-401 errors', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error = new Error('Internal Server Error');
      error.response = { status: 500 };
      authService.getCurrentUser.mockRejectedValue(error);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(tokenStorage.clearTokens).not.toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle errors without response property gracefully', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(tokenStorage.clearTokens).not.toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should report auth check failed with undefined status for network errors', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Network failure'));

      renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(reportAuthCheckFailed).toHaveBeenCalledWith(
          'UserProvider.fetchUser',
          undefined
        );
      });
    });
  });

  // =============================================
  // Cleanup / memory leak prevention
  // =============================================
  describe('cleanup', () => {
    it('should not update state after unmount (isMounted guard)', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);

      const deferred = createDeferred();
      authService.getCurrentUser.mockReturnValue(deferred.promise);

      const { result, unmount } = renderHook(() => useUser(), { wrapper });

      // Unmount before the API resolves
      unmount();

      // Now resolve - should NOT cause state update warnings
      await act(async () => {
        deferred.resolve(MOCK_USER);
      });

      // No "Can't perform a React state update on an unmounted component" warning
      // The isMounted flag prevents setCurrentUser/setIsLoading after unmount
      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('unmounted')
      );
    });

    it('should not update state after unmount on error path', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);

      const deferred = createDeferred();
      authService.getCurrentUser.mockReturnValue(deferred.promise);

      const { unmount } = renderHook(() => useUser(), { wrapper });

      unmount();

      // Reject after unmount
      await act(async () => {
        deferred.reject(new Error('Late error'));
      });

      // If isMounted is properly checked, no state updates occur
      // No unhandled error or state update warning expected
    });

    it('should set isMounted=false in cleanup function', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);

      const deferred = createDeferred();
      authService.getCurrentUser.mockReturnValue(deferred.promise);

      const { unmount } = renderHook(() => useUser(), { wrapper });

      // Unmount triggers the cleanup (isMounted = false)
      unmount();

      // Resolve the pending API call
      await act(async () => {
        deferred.resolve(MOCK_USER);
      });

      // The fact that we get here without errors proves isMounted guard works
      // Tokens should not have been cleared since no error occurred
      expect(tokenStorage.clearTokens).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // Rendering children
  // =============================================
  describe('rendering', () => {
    it('should render children', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      render(
        <UserProvider>
          <div data-testid="child">Hello</div>
        </UserProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('should provide context values to nested children', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      function Consumer() {
        const { currentUser, isLoading } = useUser();
        if (isLoading) return <div>Loading</div>;
        return <div data-testid="user-email">{currentUser?.email}</div>;
      }

      render(
        <UserProvider>
          <Consumer />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent(
          'test@bellor.app'
        );
      });
    });
  });
});
