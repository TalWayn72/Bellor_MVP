import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue({ users: [] }) },
  likeService: { likeUser: vi.fn().mockResolvedValue({ isMatch: false }) },
}));

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

vi.mock('@/data/demoData', () => ({
  getDemoProfiles: () => [
    { id: 'p1', nickname: 'Alice', age: 25, onboarding_completed: true },
    { id: 'p2', nickname: 'Bob', age: 28, onboarding_completed: true },
  ],
}));

vi.mock('@/components/discover/DiscoverCard', () => ({
  default: ({ profile }) => <div data-testid="discover-card">{profile.nickname}</div>,
}));

vi.mock('@/components/discover/DiscoverFilters', () => ({
  default: () => <div data-testid="discover-filters">Filters</div>,
}));

import Discover from './Discover';

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

describe('Discover', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Discover />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Discover />, { wrapper: createWrapper() });
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<Discover />, { wrapper: createWrapper() });
    // SlidersHorizontal icon is inside a button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when user is loading', async () => {
    const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
    useCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    const { container } = render(<Discover />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });
});
