import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Welcome from './Welcome';

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

describe('Welcome', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Welcome />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the app name', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    expect(screen.getByText('A place for authentic connections')).toBeInTheDocument();
  });

  it('renders get started button', () => {
    render(<Welcome />, { wrapper: createWrapper() });
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders the bellor logo', () => {
    const { container } = render(<Welcome />, { wrapper: createWrapper() });
    const img = container.querySelector('img[alt="Bellør"]');
    expect(img).toBeDefined();
  });
});
