/**
 * AuthContext Test Suite
 * Comprehensive tests for the most critical frontend state manager.
 * Every user session depends on AuthContext for authentication state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// ─── Mock Dependencies ──────────────────────────────────────────────────────

vi.mock('@/api/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock('@/api/client/tokenStorage', () => ({
  tokenStorage: {
    isAuthenticated: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    setAccessToken: vi.fn(),
    setUser: vi.fn(),
    getUser: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

vi.mock('@/utils/authFieldValidator', () => ({
  validateAuthUserFields: vi.fn(() => []),
}));

vi.mock('@/security/securityEventReporter', () => ({
  reportAuthCheckFailed: vi.fn(),
  reportTokenCleared: vi.fn(),
}));

import { authService } from '@/api/services/authService';
import { tokenStorage } from '@/api/client/tokenStorage';
import { validateAuthUserFields } from '@/utils/authFieldValidator';
import { reportAuthCheckFailed, reportTokenCleared } from '@/security/securityEventReporter';

// ─── Test Helpers ────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'user-123',
  email: 'test@bellor.app',
  first_name: 'Test',
  last_name: 'User',
  is_admin: false,
};

const MOCK_AUTH_RESPONSE = {
  user: MOCK_USER,
  accessToken: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
};

const MOCK_REGISTER_DATA = {
  email: 'new@bellor.app',
  password: 'SecureP@ss1',
  firstName: 'New',
  lastName: 'User',
};

/**
 * Wrapper for renderHook that provides AuthProvider context.
 * Waits for initial auth check to complete before returning.
 */
function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('[P0][auth] AuthContext', () => {
  let originalLocation;
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no tokens stored
    tokenStorage.isAuthenticated.mockReturnValue(false);

    // Suppress console.error from AuthContext's catch blocks
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location.href for redirect tests
    originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Initial State
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Initial state', () => {
    it('should start with isLoadingAuth=true before auth check resolves', () => {
      // Keep auth check pending forever by returning a never-resolving promise
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockReturnValue(new Promise(() => {}));

      const { result } = renderAuthHook();

      expect(result.current.isLoadingAuth).toBe(true);
    });

    it('should provide default context values', async () => {
      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authError).toBeNull();
      expect(result.current.isLoadingPublicSettings).toBe(false);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.navigateToLogin).toBe('function');
      expect(typeof result.current.checkUserAuth).toBe('function');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // useAuth outside of provider
  // ═══════════════════════════════════════════════════════════════════════════

  describe('useAuth outside provider', () => {
    it('should throw when used outside AuthProvider', () => {
      // Suppress React error boundary logging
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      spy.mockRestore();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // checkUserAuth (on mount)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('checkUserAuth (on mount)', () => {
    it('should set user when tokens exist and getCurrentUser succeeds', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(result.current.user).toEqual(MOCK_USER);
      expect(authService.getCurrentUser).toHaveBeenCalledOnce();
    });

    it('should set isAuthenticated=true when user is loaded', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should call validateAuthUserFields with user data on success', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(validateAuthUserFields).toHaveBeenCalledWith(
        MOCK_USER,
        'AuthContext.checkUserAuth'
      );
    });

    it('should clear tokens and set auth error when getCurrentUser returns 401', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error401);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(tokenStorage.clearTokens).toHaveBeenCalledOnce();
      expect(result.current.authError).toEqual({
        type: 'auth_required',
        message: 'Authentication required',
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should clear tokens and set auth error when getCurrentUser returns 403', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error403 = new Error('Forbidden');
      error403.response = { status: 403 };
      authService.getCurrentUser.mockRejectedValue(error403);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(tokenStorage.clearTokens).toHaveBeenCalledOnce();
      expect(result.current.authError).toEqual({
        type: 'auth_required',
        message: 'Authentication required',
      });
    });

    it('should report security events when auth check fails with 401', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error401);

      renderAuthHook();

      await waitFor(() => {
        expect(reportAuthCheckFailed).toHaveBeenCalledWith(
          'AuthContext.checkUserAuth',
          401
        );
      });

      expect(reportTokenCleared).toHaveBeenCalledWith(
        'AuthContext.checkUserAuth',
        'Token cleared after 401 response'
      );
    });

    it('should handle network errors gracefully without clearing tokens', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const networkError = new Error('Network Error');
      // No response object = network-level failure
      authService.getCurrentUser.mockRejectedValue(networkError);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      // Should NOT clear tokens on network error (only on 401/403)
      expect(tokenStorage.clearTokens).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.authError).toBeNull();
    });

    it('should set isLoadingAuth=false after successful check', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      const { result } = renderAuthHook();

      // Initially loading
      expect(result.current.isLoadingAuth).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });
    });

    it('should set isLoadingAuth=false after failed check', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockRejectedValue(new Error('Server error'));

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });
    });

    it('should skip API call and set isLoadingAuth=false when no token exists', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderAuthHook();

      await waitFor(() => {
        expect(result.current.isLoadingAuth).toBe(false);
      });

      expect(authService.getCurrentUser).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // login
  // ═══════════════════════════════════════════════════════════════════════════

  describe('login', () => {
    it('should call authService.login with credentials', async () => {
      authService.login.mockResolvedValue(MOCK_AUTH_RESPONSE);
      const credentials = { email: 'test@bellor.app', password: 'password123' };

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.login(credentials);
      });

      expect(authService.login).toHaveBeenCalledWith(credentials);
    });

    it('should set user and isAuthenticated on successful login', async () => {
      authService.login.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.login({ email: 'test@bellor.app', password: 'pass' });
      });

      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoadingAuth).toBe(false);
    });

    it('should return the logged-in user on success', async () => {
      authService.login.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      let returnedUser;
      await act(async () => {
        returnedUser = await result.current.login({ email: 'a@b.c', password: 'x' });
      });

      expect(returnedUser).toEqual(MOCK_USER);
    });

    it('should call validateAuthUserFields after login', async () => {
      authService.login.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.login({ email: 'a@b.c', password: 'x' });
      });

      expect(validateAuthUserFields).toHaveBeenCalledWith(
        MOCK_USER,
        'AuthContext.login'
      );
    });

    it('should throw error on invalid credentials', async () => {
      const loginError = new Error('Invalid credentials');
      loginError.response = { data: { message: 'Invalid email or password' } };
      authService.login.mockRejectedValue(loginError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await expect(
        act(async () => {
          await result.current.login({ email: 'bad@email.com', password: 'wrong' });
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should set authError with server message on failed login', async () => {
      const loginError = new Error('Login failed');
      loginError.response = { data: { message: 'Account is locked' } };
      authService.login.mockRejectedValue(loginError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.login({ email: 'a@b.c', password: 'x' });
        } catch {
          // Expected - login re-throws the error
        }
      });

      expect(result.current.authError).toEqual({
        type: 'login_failed',
        message: 'Account is locked',
      });
      expect(result.current.isLoadingAuth).toBe(false);
    });

    it('should set default error message when no server message', async () => {
      const loginError = new Error('Network Error');
      // No response.data.message
      authService.login.mockRejectedValue(loginError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.login({ email: 'a@b.c', password: 'x' });
        } catch {
          // Expected - login re-throws the error
        }
      });

      expect(result.current.authError).toEqual({
        type: 'login_failed',
        message: 'Login failed',
      });
    });

    it('should clear previous authError before login attempt', async () => {
      // First: fail a login to create an authError
      const loginError = new Error('Bad credentials');
      loginError.response = { data: { message: 'Wrong password' } };
      authService.login.mockRejectedValueOnce(loginError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.login({ email: 'a@b.c', password: 'wrong' });
        } catch {
          // Expected - login re-throws the error
        }
      });

      expect(result.current.authError).not.toBeNull();

      // Second: succeed login
      authService.login.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

      await act(async () => {
        await result.current.login({ email: 'a@b.c', password: 'correct' });
      });

      expect(result.current.authError).toBeNull();
    });

    it('should set isLoadingAuth=true during login and false after', async () => {
      let resolveLogin;
      authService.login.mockReturnValue(
        new Promise((resolve) => { resolveLogin = resolve; })
      );

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      // Start login but don't resolve yet
      let loginPromise;
      act(() => {
        loginPromise = result.current.login({ email: 'a@b.c', password: 'x' });
      });

      expect(result.current.isLoadingAuth).toBe(true);

      // Resolve login
      await act(async () => {
        resolveLogin(MOCK_AUTH_RESPONSE);
        await loginPromise;
      });

      expect(result.current.isLoadingAuth).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // register
  // ═══════════════════════════════════════════════════════════════════════════

  describe('register', () => {
    it('should call authService.register with user data', async () => {
      authService.register.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.register(MOCK_REGISTER_DATA);
      });

      expect(authService.register).toHaveBeenCalledWith(MOCK_REGISTER_DATA);
    });

    it('should set user and isAuthenticated on successful registration', async () => {
      authService.register.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.register(MOCK_REGISTER_DATA);
      });

      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoadingAuth).toBe(false);
    });

    it('should return the new user on success', async () => {
      authService.register.mockResolvedValue(MOCK_AUTH_RESPONSE);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      let newUser;
      await act(async () => {
        newUser = await result.current.register(MOCK_REGISTER_DATA);
      });

      expect(newUser).toEqual(MOCK_USER);
    });

    it('should handle duplicate email error', async () => {
      const dupError = new Error('Conflict');
      dupError.response = { data: { message: 'Email already exists' } };
      authService.register.mockRejectedValue(dupError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      let thrownError;
      await act(async () => {
        try {
          await result.current.register(MOCK_REGISTER_DATA);
        } catch (err) {
          thrownError = err;
        }
      });

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Conflict');
      expect(result.current.authError).toEqual({
        type: 'registration_failed',
        message: 'Email already exists',
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set default error message when no server message', async () => {
      const regError = new Error('Server error');
      authService.register.mockRejectedValue(regError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.register(MOCK_REGISTER_DATA);
        } catch {
          // Expected - register re-throws the error
        }
      });

      expect(result.current.authError).toEqual({
        type: 'registration_failed',
        message: 'Registration failed',
      });
    });

    it('should set isLoadingAuth=false after failed registration', async () => {
      authService.register.mockRejectedValue(new Error('Fail'));

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.register(MOCK_REGISTER_DATA);
        } catch {
          // Expected - register re-throws the error
        }
      });

      expect(result.current.isLoadingAuth).toBe(false);
    });

    it('should clear previous authError before register attempt', async () => {
      // First: fail registration
      const regError = new Error('Fail');
      regError.response = { data: { message: 'Validation error' } };
      authService.register.mockRejectedValueOnce(regError);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        try {
          await result.current.register(MOCK_REGISTER_DATA);
        } catch {
          // Expected - register re-throws the error
        }
      });

      expect(result.current.authError).not.toBeNull();

      // Second: succeed registration
      authService.register.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

      await act(async () => {
        await result.current.register(MOCK_REGISTER_DATA);
      });

      expect(result.current.authError).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // logout
  // ═══════════════════════════════════════════════════════════════════════════

  describe('logout', () => {
    it('should call authService.logout', async () => {
      // Setup: log in first
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(authService.logout).toHaveBeenCalledOnce();
    });

    it('should clear user state after logout', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.user).toEqual(MOCK_USER));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });

    it('should set isAuthenticated=false after logout', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should redirect to /Welcome by default', async () => {
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      await act(async () => {
        await result.current.logout();
      });

      expect(window.location.href).toBe('/Welcome');
    });

    it('should not redirect when shouldRedirect is false', async () => {
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      window.location.href = '/current-page';

      await act(async () => {
        await result.current.logout(false);
      });

      expect(window.location.href).toBe('/current-page');
    });

    it('should still clear state even when authService.logout throws', async () => {
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);
      authService.logout.mockRejectedValue(new Error('Logout API failed'));

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        try {
          await result.current.logout();
        } catch {
          // Expected - logout uses try/finally so the error propagates
        }
      });

      // State should be cleared regardless of API failure (finally block)
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // navigateToLogin
  // ═══════════════════════════════════════════════════════════════════════════

  describe('navigateToLogin', () => {
    it('should redirect to /Welcome', async () => {
      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      act(() => {
        result.current.navigateToLogin();
      });

      expect(window.location.href).toBe('/Welcome');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // checkUserAuth (manual re-check)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('checkUserAuth (manual)', () => {
    it('should re-fetch user when called manually', async () => {
      // First mount: no token
      tokenStorage.isAuthenticated.mockReturnValue(false);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      expect(result.current.user).toBeNull();

      // Simulate: user logs in externally (token now exists)
      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      await act(async () => {
        await result.current.checkUserAuth();
      });

      expect(result.current.user).toEqual(MOCK_USER);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear authError on re-check', async () => {
      // First: fail with 401
      tokenStorage.isAuthenticated.mockReturnValue(true);
      const error401 = new Error('Unauthorized');
      error401.response = { status: 401 };
      authService.getCurrentUser.mockRejectedValue(error401);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.authError).not.toBeNull());

      // Second: succeed
      tokenStorage.isAuthenticated.mockReturnValue(true);
      tokenStorage.clearTokens.mockClear();
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      await act(async () => {
        await result.current.checkUserAuth();
      });

      expect(result.current.authError).toBeNull();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Context rendering with children
  // ═══════════════════════════════════════════════════════════════════════════

  describe('AuthProvider rendering', () => {
    it('should render children components', async () => {
      render(
        <AuthProvider>
          <div data-testid="child-content">Protected Content</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should provide auth state to nested consumers', async () => {
      function AuthStatusDisplay() {
        const { isAuthenticated, user } = useAuth();
        return (
          <div>
            <span data-testid="auth-status">{isAuthenticated ? 'yes' : 'no'}</span>
            <span data-testid="user-email">{user?.email || 'none'}</span>
          </div>
        );
      }

      tokenStorage.isAuthenticated.mockReturnValue(true);
      authService.getCurrentUser.mockResolvedValue(MOCK_USER);

      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@bellor.app');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // State transitions (full flow)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Full authentication flow', () => {
    it('should handle login then logout cycle correctly', async () => {
      authService.login.mockResolvedValue(MOCK_AUTH_RESPONSE);
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      // Step 1: Not authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      // Step 2: Login
      await act(async () => {
        await result.current.login({ email: 'test@bellor.app', password: 'pass' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(MOCK_USER);

      // Step 3: Logout
      await act(async () => {
        await result.current.logout(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle register then logout cycle correctly', async () => {
      authService.register.mockResolvedValue(MOCK_AUTH_RESPONSE);
      authService.logout.mockResolvedValue(undefined);

      const { result } = renderAuthHook();
      await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

      // Register
      await act(async () => {
        await result.current.register(MOCK_REGISTER_DATA);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(MOCK_USER);

      // Logout
      await act(async () => {
        await result.current.logout(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });
});
