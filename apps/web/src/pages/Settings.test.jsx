import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ logout: vi.fn() })),
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
  beforeEach(() => { vi.clearAllMocks(); });

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
});
