import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/client/tokenStorage', () => ({
  tokenStorage: { setTokens: vi.fn() },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ checkUserAuth: vi.fn() })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import OAuthCallback from './OAuthCallback';

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

describe('OAuthCallback', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<OAuthCallback />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders completing sign in text', () => {
    render(<OAuthCallback />, { wrapper: createWrapper() });
    expect(screen.getByText('Completing Sign In')).toBeInTheDocument();
  });

  it('renders loading spinner', () => {
    render(<OAuthCallback />, { wrapper: createWrapper() });
    expect(screen.getByText('Please wait while we set up your account...')).toBeInTheDocument();
  });
});
