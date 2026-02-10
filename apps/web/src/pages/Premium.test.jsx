import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', is_premium: false },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/premium/PlanCards', () => ({
  PlanSelector: ({ selectedPlan }) => (
    <div data-testid="plan-selector">Plan: {selectedPlan}</div>
  ),
  FeaturesList: ({ isPremium }) => (
    <div data-testid="features-list">Premium: {isPremium ? 'yes' : 'no'}</div>
  ),
}));

import Premium from './Premium';

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

describe('[P0][payments] Premium', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Premium />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('Bellor Premium')).toBeInTheDocument();
  });

  it('renders unlock potential heading', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('Unlock Your Full Potential')).toBeInTheDocument();
  });

  it('renders plan selector', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByTestId('plan-selector')).toBeInTheDocument();
  });

  it('renders features list', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByTestId('features-list')).toHaveTextContent('Premium: no');
  });

  it('renders stats section', () => {
    render(<Premium />, { wrapper: createWrapper() });
    expect(screen.getByText('10K+')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
