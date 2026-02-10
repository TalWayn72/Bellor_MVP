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

vi.mock('@/components/dates/DateIdeaCard', () => ({
  default: ({ idea }) => <div data-testid="date-idea-card">{idea.title}</div>,
}));

import DateIdeas from './DateIdeas';

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

describe('[P3][social] DateIdeas', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<DateIdeas />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<DateIdeas />, { wrapper: createWrapper() });
    expect(screen.getByText('Date Ideas')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<DateIdeas />, { wrapper: createWrapper() });
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Romantic')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
    expect(screen.getByText('Foodie')).toBeInTheDocument();
  });

  it('renders date idea cards', () => {
    render(<DateIdeas />, { wrapper: createWrapper() });
    const cards = screen.getAllByTestId('date-idea-card');
    expect(cards.length).toBe(6);
  });

  it('renders first date idea title', () => {
    render(<DateIdeas />, { wrapper: createWrapper() });
    expect(screen.getByText('Coffee & Conversation')).toBeInTheDocument();
  });
});
