import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Splash from './Splash';

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

describe('Splash', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });

  afterEach(() => { vi.useRealTimers(); });

  it('renders without crashing', () => {
    const { container } = render(<Splash />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the app tagline', () => {
    render(<Splash />, { wrapper: createWrapper() });
    expect(screen.getByText('Authentic Connections')).toBeInTheDocument();
  });

  it('renders the bellor logo', () => {
    const { container } = render(<Splash />, { wrapper: createWrapper() });
    const img = container.querySelector('img[alt="Bellør"]');
    expect(img).toBeDefined();
  });
});
