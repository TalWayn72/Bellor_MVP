import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { getBlockedUsers: vi.fn().mockResolvedValue({ blockedUsers: [] }), unblockUser: vi.fn() },
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

vi.mock('@/components/settings/BlockedUserCard', () => ({
  default: () => <div data-testid="blocked-card">Blocked User</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import BlockedUsers from './BlockedUsers';

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

describe('[P0][safety] BlockedUsers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<BlockedUsers />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<BlockedUsers />, { wrapper: createWrapper() });
    expect(screen.getByText('Blocked Users')).toBeInTheDocument();
  });

  it('renders empty state when no blocked users', () => {
    render(<BlockedUsers />, { wrapper: createWrapper() });
    expect(screen.getByText('No Blocked Users')).toBeInTheDocument();
  });

  it('renders about blocking section', () => {
    render(<BlockedUsers />, { wrapper: createWrapper() });
    expect(screen.getByText('About Blocking')).toBeInTheDocument();
  });
});
