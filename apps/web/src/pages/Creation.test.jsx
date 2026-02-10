import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  missionService: { getTodaysMission: vi.fn().mockResolvedValue({ data: null }) },
  responseService: { listResponses: vi.fn().mockResolvedValue({ responses: [] }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/creation/CreationResponseGrid', () => ({
  default: () => <div data-testid="response-grid">Grid</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Creation from './Creation';

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

describe('[P1][content] Creation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Creation />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Creation />, { wrapper: createWrapper() });
    expect(screen.getByText('Creation')).toBeInTheDocument();
  });

  it('renders task option buttons', () => {
    render(<Creation />, { wrapper: createWrapper() });
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Drawing')).toBeInTheDocument();
  });

  it('renders my creations section', () => {
    render(<Creation />, { wrapper: createWrapper() });
    expect(screen.getByText('My Creations')).toBeInTheDocument();
  });

  it('renders stats', () => {
    render(<Creation />, { wrapper: createWrapper() });
    expect(screen.getByText('Total creations')).toBeInTheDocument();
    expect(screen.getByText('Hearts')).toBeInTheDocument();
  });
});
