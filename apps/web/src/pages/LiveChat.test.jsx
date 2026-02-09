import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', full_name: 'Test User' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import LiveChat from './LiveChat';

// JSDOM does not implement scrollIntoView - stub it once
beforeAll(() => {
  Element.prototype.scrollIntoView = function () {};
});

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

describe('LiveChat', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<LiveChat />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Live Support')).toBeInTheDocument();
  });

  it('renders online status', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders message input', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('renders quick reply options', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText('Issue with matching')).toBeInTheDocument();
    expect(screen.getByText('Payment problem')).toBeInTheDocument();
  });

  it('renders greeting message', () => {
    render(<LiveChat />, { wrapper: createWrapper() });
    expect(screen.getByText(/How can we help you today/)).toBeInTheDocument();
  });
});
