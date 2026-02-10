import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  notificationService: { getNotifications: vi.fn().mockResolvedValue({ notifications: [] }) },
  userService: {},
  socketService: { on: vi.fn(() => vi.fn()) },
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

vi.mock('@/data/demoData', () => ({
  getDemoNotifications: vi.fn(() => []),
}));

vi.mock('@/components/notifications/NotificationItem', () => ({
  default: () => <div data-testid="notification-item">Notification</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Notifications from './Notifications';

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

describe('[P1][social] Notifications', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Notifications />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Notifications />, { wrapper: createWrapper() });
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    render(<Notifications />, { wrapper: createWrapper() });
    expect(screen.getByText('Today Chat')).toBeInTheDocument();
    expect(screen.getByText('Crushes')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });
});
