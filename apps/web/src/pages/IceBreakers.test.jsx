import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock clipboard
Object.assign(navigator, { clipboard: { writeText: vi.fn() } });

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

import IceBreakers from './IceBreakers';

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

describe('[P3][social] IceBreakers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<IceBreakers />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<IceBreakers />, { wrapper: createWrapper() });
    expect(screen.getByText('Ice Breakers')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    render(<IceBreakers />, { wrapper: createWrapper() });
    expect(screen.getByText(/All/)).toBeInTheDocument();
    expect(screen.getByText(/Fun/)).toBeInTheDocument();
    expect(screen.getByText(/Deep/)).toBeInTheDocument();
    expect(screen.getByText(/Creative/)).toBeInTheDocument();
    expect(screen.getByText(/Casual/)).toBeInTheDocument();
  });

  it('renders ice breaker questions', () => {
    render(<IceBreakers />, { wrapper: createWrapper() });
    expect(screen.getByText("What's your favorite way to spend a weekend?")).toBeInTheDocument();
  });

  it('renders copy buttons for each ice breaker', () => {
    render(<IceBreakers />, { wrapper: createWrapper() });
    const buttons = screen.getAllByRole('button');
    // Category buttons (5) + copy buttons (15) + back button area
    expect(buttons.length).toBeGreaterThan(5);
  });
});
