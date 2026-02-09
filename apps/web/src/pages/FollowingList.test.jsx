import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  followService: { getUserFollowing: vi.fn().mockResolvedValue({ following: [] }), getUserFollowers: vi.fn().mockResolvedValue({ followers: [] }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/data/demoData', () => ({
  getDemoFollows: vi.fn(() => []),
}));

vi.mock('@/components/profile/FollowingCard', () => ({
  default: () => <div data-testid="following-card">Following</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import FollowingList from './FollowingList';

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

describe('FollowingList', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<FollowingList />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<FollowingList />, { wrapper: createWrapper() });
    expect(screen.getByText('User Connections')).toBeInTheDocument();
  });

  it('renders following and followers tabs', () => {
    render(<FollowingList />, { wrapper: createWrapper() });
    expect(screen.getByText(/Following/)).toBeInTheDocument();
    expect(screen.getByText(/Followers/)).toBeInTheDocument();
  });
});
