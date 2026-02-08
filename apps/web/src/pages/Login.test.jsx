import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ login: vi.fn(), register: vi.fn(), isLoadingAuth: false })),
}));

vi.mock('@/api/client/apiClient', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { data: { google: false } } }) },
}));

vi.mock('@/components/auth/GoogleIcon', () => ({
  default: () => <span data-testid="google-icon">G</span>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Login from './Login';

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

describe('Login', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Login />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders welcome back heading', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders guest login option', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });
});
