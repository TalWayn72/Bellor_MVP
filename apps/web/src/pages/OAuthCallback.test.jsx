import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();
const mockSetTokens = vi.fn();
const mockCheckUserAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/api/client/tokenStorage', () => ({
  tokenStorage: {
    setTokens: (...args) => mockSetTokens(...args),
    getAccessToken: vi.fn(() => null),
  },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ checkUserAuth: mockCheckUserAuth })),
}));

vi.mock('@/security/securityEventReporter', () => ({
  reportAuthCheckFailed: vi.fn(),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import OAuthCallback from './OAuthCallback';
import { reportAuthCheckFailed } from '@/security/securityEventReporter';

const createMemoryWrapper = (initialEntries = ['/oauth/callback']) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('[P0][auth] OAuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockSetTokens.mockReset();
    mockCheckUserAuth.mockResolvedValue({});
  });

  // --- Existing scaffold tests (preserved, adapted to actual behavior) ---

  it('renders without crashing', () => {
    const { container } = render(<OAuthCallback />, {
      wrapper: createMemoryWrapper(),
    });
    expect(container).toBeDefined();
  });

  it('renders completing sign in text with valid tokens', async () => {
    // Make checkUserAuth hang so we can see the loading state
    mockCheckUserAuth.mockReturnValue(new Promise(() => {}));

    render(<OAuthCallback />, {
      wrapper: createMemoryWrapper([
        '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
      ]),
    });
    // The loading state is the initial render before useEffect completes
    expect(screen.getByText('Completing Sign In')).toBeInTheDocument();
  });

  it('renders loading spinner message with valid tokens', async () => {
    mockCheckUserAuth.mockReturnValue(new Promise(() => {}));

    render(<OAuthCallback />, {
      wrapper: createMemoryWrapper([
        '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
      ]),
    });
    expect(screen.getByText('Please wait while we set up your account...')).toBeInTheDocument();
  });

  // --- New behavioral tests ---

  describe('loading state', () => {
    it('should show loading state while processing OAuth tokens', () => {
      // Make checkUserAuth hang indefinitely so loading state persists
      mockCheckUserAuth.mockReturnValue(new Promise(() => {}));

      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
        ]),
      });

      expect(screen.getByText('Completing Sign In')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we set up your account...')).toBeInTheDocument();
    });
  });

  describe('successful OAuth callback', () => {
    it('should store tokens and call checkUserAuth on success', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
        ]),
      });

      await waitFor(() => {
        expect(mockSetTokens).toHaveBeenCalledWith('abc123', 'xyz789');
      });

      await waitFor(() => {
        expect(mockCheckUserAuth).toHaveBeenCalled();
      });
    });

    it('should redirect to home for existing user without returnUrl', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
        ]),
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Home');
      });
    });

    it('should redirect to returnUrl if provided', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789&returnUrl=/Profile',
        ]),
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Profile');
      });
    });

    it('should redirect to onboarding step 3 for new user without returnUrl', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789&isNewUser=true',
        ]),
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Onboarding?step=3');
      });
    });
  });

  describe('OAuth error handling', () => {
    it('should display error for oauth_denied error param', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=oauth_denied']),
      });

      await waitFor(() => {
        expect(screen.getByText('OAuth login was cancelled')).toBeInTheDocument();
      });
    });

    it('should display "Login Failed" heading on error', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=oauth_failed']),
      });

      await waitFor(() => {
        expect(screen.getByText('Login Failed')).toBeInTheDocument();
      });
    });

    it('should display error for account_blocked', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=account_blocked']),
      });

      await waitFor(() => {
        expect(screen.getByText('Your account has been deactivated')).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown error param', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=something_weird']),
      });

      await waitFor(() => {
        expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
      });
    });

    it('should report auth check failed on error', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=oauth_denied']),
      });

      await waitFor(() => {
        expect(reportAuthCheckFailed).toHaveBeenCalledWith('OAuthCallback', undefined);
      });
    });

    it('should show redirecting message on error', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=oauth_failed']),
      });

      await waitFor(() => {
        expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
      });
    });

    it('should redirect to onboarding after error timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?error=oauth_failed']),
      });

      // Wait for error to display
      await waitFor(() => {
        expect(screen.getByText('Login Failed')).toBeInTheDocument();
      });

      // Advance timer to trigger the setTimeout redirect
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Onboarding?step=2');
      });

      vi.useRealTimers();
    });
  });

  describe('missing tokens', () => {
    it('should display error when tokens are missing', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback']),
      });

      await waitFor(() => {
        expect(screen.getByText('Missing authentication tokens')).toBeInTheDocument();
      });
    });

    it('should display error when only accessToken is present', async () => {
      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback?accessToken=abc123']),
      });

      await waitFor(() => {
        expect(screen.getByText('Missing authentication tokens')).toBeInTheDocument();
      });
    });

    it('should redirect after missing tokens error timeout', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper(['/oauth/callback']),
      });

      await waitFor(() => {
        expect(screen.getByText('Missing authentication tokens')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Onboarding?step=2');
      });

      vi.useRealTimers();
    });
  });

  describe('checkUserAuth failure', () => {
    it('should display error when checkUserAuth throws', async () => {
      mockCheckUserAuth.mockRejectedValue({ response: { status: 500 } });

      // Suppress console.error for this test since OAuthCallback logs it
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<OAuthCallback />, {
        wrapper: createMemoryWrapper([
          '/oauth/callback?accessToken=abc123&refreshToken=xyz789',
        ]),
      });

      await waitFor(() => {
        expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
