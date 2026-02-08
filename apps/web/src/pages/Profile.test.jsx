import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  responseService: { listResponses: vi.fn().mockResolvedValue({ responses: [] }), deleteResponse: vi.fn() },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', full_name: 'Test User', age: 25, is_verified: false, profile_images: [] },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/profile/ProfileAboutTab', () => ({
  default: () => <div data-testid="about-tab">About</div>,
}));

vi.mock('@/components/profile/ProfileBookTab', () => ({
  default: () => <div data-testid="book-tab">Book</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Profile from './Profile';

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

describe('Profile', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Profile />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders tab buttons', () => {
    render(<Profile />, { wrapper: createWrapper() });
    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByText('My Book')).toBeInTheDocument();
  });

  it('renders edit profile button', () => {
    render(<Profile />, { wrapper: createWrapper() });
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<Profile />, { wrapper: createWrapper() });
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
