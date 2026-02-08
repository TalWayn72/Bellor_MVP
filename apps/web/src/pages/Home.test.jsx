import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Home from './Home';

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

describe('Home', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Home />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the bellor logo', () => {
    const { container } = render(<Home />, { wrapper: createWrapper() });
    const img = container.querySelector('img[alt="Bellør"]');
    expect(img).toBeDefined();
  });

  it('redirects to Welcome page', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(mockNavigate).toHaveBeenCalled();
  });
});
