import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', email: 'test@test.com', full_name: 'Test User' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import EmailSupport from './EmailSupport';

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

describe('[P3][profile] EmailSupport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<EmailSupport />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<EmailSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Email Support')).toBeInTheDocument();
  });

  it('renders get help heading', () => {
    render(<EmailSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Get Help via Email')).toBeInTheDocument();
  });

  it('renders category selector', () => {
    render(<EmailSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Select category...')).toBeInTheDocument();
  });

  it('renders subject and message fields', () => {
    render(<EmailSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<EmailSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });
});
