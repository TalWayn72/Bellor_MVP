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

vi.mock('@/components/referral/ReferralStats', () => ({
  default: ({ referralCode, copied }) => (
    <div data-testid="referral-stats">Code: {referralCode}</div>
  ),
}));

import ReferralProgram from './ReferralProgram';

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

describe('[P3][social] ReferralProgram', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<ReferralProgram />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<ReferralProgram />, { wrapper: createWrapper() });
    expect(screen.getByText('Refer Friends')).toBeInTheDocument();
  });

  it('renders referral stats component', () => {
    render(<ReferralProgram />, { wrapper: createWrapper() });
    expect(screen.getByTestId('referral-stats')).toBeInTheDocument();
  });

  it('renders rewards section', () => {
    render(<ReferralProgram />, { wrapper: createWrapper() });
    expect(screen.getByText('Your Rewards')).toBeInTheDocument();
    expect(screen.getByText('Free Premium Month')).toBeInTheDocument();
    expect(screen.getByText('5 Super Likes')).toBeInTheDocument();
    expect(screen.getByText('Profile Boost')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Badge')).toBeInTheDocument();
  });

  it('renders invite by email section', () => {
    render(<ReferralProgram />, { wrapper: createWrapper() });
    expect(screen.getByText('Invite by Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('friend@example.com')).toBeInTheDocument();
  });
});
