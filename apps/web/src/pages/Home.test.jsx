import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to, replace }) => (
      <div data-testid="navigate" data-to={to} data-replace={String(replace)} />
    )),
  };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import { useAuth } from '@/lib/AuthContext';
import Home from './Home';

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

describe('[P1][content] Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<Home />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the bellor logo while auth is loading', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoadingAuth: true,
    });

    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByAltText('Bellor')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to Welcome', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/Welcome');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('redirects authenticated normal users to SharedSpace', () => {
    useAuth.mockReturnValue({
      user: { id: 'user-1', is_admin: false },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/SharedSpace');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('redirects authenticated admin users to AdminDashboard', () => {
    useAuth.mockReturnValue({
      user: { id: 'admin-1', is_admin: true },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/AdminDashboard');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });
});
