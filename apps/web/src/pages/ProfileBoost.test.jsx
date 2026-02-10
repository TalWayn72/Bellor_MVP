import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/premium/BoostOptions', () => ({
  default: ({ activeBoost, isPending }) => (
    <div data-testid="boost-options">
      {activeBoost ? 'Active' : 'No boost'}
    </div>
  ),
}));

import ProfileBoost from './ProfileBoost';

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

describe('[P2][payments] ProfileBoost', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Profile Boost')).toBeInTheDocument();
  });

  it('renders boost hero section', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Boost Your Profile')).toBeInTheDocument();
  });

  it('renders boost options component', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByTestId('boost-options')).toHaveTextContent('No boost');
  });

  it('renders premium CTA section', () => {
    render(<ProfileBoost />, { wrapper: createWrapper() });
    expect(screen.getByText('Want More Boosts?')).toBeInTheDocument();
    expect(screen.getByText('Go Premium')).toBeInTheDocument();
  });
});
