import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', age_range_min: 18, age_range_max: 35 },
    isLoading: false,
    updateUser: vi.fn(),
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/settings/FilterSliders', () => ({
  default: () => <div data-testid="filter-sliders">Sliders</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import FilterSettings from './FilterSettings';

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

describe('FilterSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<FilterSettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<FilterSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Discover Filters')).toBeInTheDocument();
  });

  it('renders filter sliders', () => {
    render(<FilterSettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('filter-sliders')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<FilterSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();
  });
});
