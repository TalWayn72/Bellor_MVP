import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  likeService: {
    getReceivedLikes: vi.fn().mockResolvedValue({ likes: [] }),
    getSentLikes: vi.fn().mockResolvedValue({ likes: [] }),
  },
  responseService: { listResponses: vi.fn().mockResolvedValue({ responses: [] }) },
  chatService: { getChats: vi.fn().mockResolvedValue({ chats: [] }) },
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

vi.mock('@/data/demoData', () => ({
  getDemoLikes: () => [],
  getDemoResponses: () => [],
  getDemoChatUsers: () => [],
}));

vi.mock('@/components/analytics/AnalyticsCharts', () => ({
  StatsGrid: ({ stats }) => <div data-testid="stats-grid">Stats: {stats?.length || 0}</div>,
  ActivitySummary: () => <div data-testid="activity-summary">Activity</div>,
  PremiumCTA: () => <div data-testid="premium-cta">Upgrade</div>,
  buildStats: () => [],
}));

import Analytics from './Analytics';

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

describe('Analytics', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Analytics />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Analytics />, { wrapper: createWrapper() });
    expect(screen.getByText('Your Insights')).toBeInTheDocument();
  });

  it('renders stats grid', () => {
    render(<Analytics />, { wrapper: createWrapper() });
    expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
  });

  it('renders activity summary', () => {
    render(<Analytics />, { wrapper: createWrapper() });
    expect(screen.getByTestId('activity-summary')).toBeInTheDocument();
  });

  it('renders premium CTA for non-premium users', () => {
    render(<Analytics />, { wrapper: createWrapper() });
    expect(screen.getByTestId('premium-cta')).toBeInTheDocument();
  });
});
