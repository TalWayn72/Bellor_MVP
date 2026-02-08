import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', is_admin: true, selected_theme: 'blue' },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
  themes: {
    blue: { label: 'Ocean Blue', primary: '#3b82f6' },
    pink: { label: 'Rose Pink', primary: '#ec4899' },
  },
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/settings/ThemePreview', () => ({
  default: ({ themeKey, isSelected }) => (
    <div data-testid={`theme-${themeKey}`}>{isSelected ? 'selected' : 'not selected'}</div>
  ),
}));

import ThemeSettings from './ThemeSettings';

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

describe('ThemeSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<ThemeSettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<ThemeSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('App Theme')).toBeInTheDocument();
  });

  it('renders customize theme title', () => {
    render(<ThemeSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Customize App Theme')).toBeInTheDocument();
  });

  it('renders apply button', () => {
    render(<ThemeSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Apply Theme')).toBeInTheDocument();
  });

  it('renders theme previews', () => {
    render(<ThemeSettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('theme-blue')).toBeInTheDocument();
    expect(screen.getByTestId('theme-pink')).toBeInTheDocument();
  });
});
