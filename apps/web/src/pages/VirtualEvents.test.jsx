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

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

vi.mock('@/components/events/EventCard', () => ({
  default: ({ event }) => <div data-testid="event-card">{event.title}</div>,
  PastEventCard: ({ event }) => <div data-testid="past-event-card">{event.title}</div>,
  getDemoEvents: () => [
    { id: 'e1', title: 'Speed Dating', scheduled_at: futureDate },
    { id: 'e2', title: 'Past Mixer', scheduled_at: pastDate },
  ],
}));

import VirtualEvents from './VirtualEvents';

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

describe('VirtualEvents', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<VirtualEvents />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<VirtualEvents />, { wrapper: createWrapper() });
    expect(screen.getByText('Virtual Events')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    render(<VirtualEvents />, { wrapper: createWrapper() });
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Past Events')).toBeInTheDocument();
  });

  it('renders upcoming events after data loads', async () => {
    render(<VirtualEvents />, { wrapper: createWrapper() });
    expect(await screen.findByText('Speed Dating')).toBeInTheDocument();
  });
});
