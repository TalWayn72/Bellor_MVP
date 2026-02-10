import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  achievementService: {
    listAchievements: vi.fn().mockResolvedValue({ achievements: [] }),
    getMyAchievements: vi.fn().mockResolvedValue({ achievements: [] }),
  },
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

vi.mock('@/components/achievements/AchievementCard', () => ({
  default: ({ achievement }) => (
    <div data-testid="achievement-card">{achievement.name}</div>
  ),
}));

import Achievements from './Achievements';

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

describe('[P2][social] Achievements', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Achievements />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Achievements />, { wrapper: createWrapper() });
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  it('renders total points display', () => {
    render(<Achievements />, { wrapper: createWrapper() });
    expect(screen.getByText('Total Points')).toBeInTheDocument();
  });

  it('renders category tabs', () => {
    render(<Achievements />, { wrapper: createWrapper() });
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('renders achievement cards when data loads', async () => {
    render(<Achievements />, { wrapper: createWrapper() });
    const cards = await screen.findAllByTestId('achievement-card');
    expect(cards.length).toBe(5);
  });

  it('shows unlocked count', () => {
    render(<Achievements />, { wrapper: createWrapper() });
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });
});
