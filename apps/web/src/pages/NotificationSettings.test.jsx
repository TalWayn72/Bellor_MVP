import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
    updateUser: vi.fn(),
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import NotificationSettings from './NotificationSettings';

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

describe('[P2][profile] NotificationSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
  });

  it('renders notification toggle items', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('New Matches')).toBeInTheDocument();
    expect(screen.getByText('New Messages')).toBeInTheDocument();
    expect(screen.getByText('Chat Requests')).toBeInTheDocument();
    expect(screen.getByText('Daily Missions')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
  });

  it('renders toggle descriptions', () => {
    render(<NotificationSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Get notified when someone likes you back')).toBeInTheDocument();
    expect(screen.getByText('Get notified about new messages')).toBeInTheDocument();
  });
});
