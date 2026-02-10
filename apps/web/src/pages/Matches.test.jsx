import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  likeService: { getReceivedLikes: vi.fn().mockResolvedValue({ likes: [] }) },
  chatService: { createOrGetChat: vi.fn() },
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
  getDemoLikes: vi.fn(() => []),
}));

vi.mock('@/components/matches/MatchCard', () => ({
  default: () => <div data-testid="match-card">Match</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Matches from './Matches';

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

describe('[P1][social] Matches', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Matches />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Matches />, { wrapper: createWrapper() });
    expect(screen.getByText('Interest')).toBeInTheDocument();
  });

  it('renders romantic and positive tabs', () => {
    render(<Matches />, { wrapper: createWrapper() });
    expect(screen.getByText(/Romantic/)).toBeInTheDocument();
    expect(screen.getByText(/Positive/)).toBeInTheDocument();
  });
});
