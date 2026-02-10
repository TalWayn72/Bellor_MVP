import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ logout: mockLogout })),
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', email: 'test@test.com', full_name: 'Test User', is_admin: false },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/settings/SettingsMenuItems', () => ({
  SettingsList: () => <div data-testid="settings-list">Settings List</div>,
  AdminSettingsList: () => <div data-testid="admin-settings-list">Admin Settings</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Settings from './Settings';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Settings', () => {
  beforeEach(() => { vi.clearAllMocks(); mockLogout.mockResolvedValue(undefined); mockNavigate.mockReset(); });

  it('renders without crashing', () => {
    const { container } = render(<Settings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders user nickname', () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('renders logout button', () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders settings list', () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('settings-list')).toBeInTheDocument();
  });

  it('renders version info', () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText('Bellor v1.0.0')).toBeInTheDocument();
  });

  describe('logout - no double navigation', () => {
    it('should call logout but NOT navigate (logout handles redirect via window.location)', async () => {
      const user = userEvent.setup();
      render(<Settings />, { wrapper: createWrapper() });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
      // navigate should NOT be called - logout() already redirects via window.location.href
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not crash when logout fails', async () => {
      const user = userEvent.setup();
      mockLogout.mockRejectedValue(new Error('Logout failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Settings />, { wrapper: createWrapper() });
      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
      expect(mockNavigate).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
