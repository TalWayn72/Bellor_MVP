import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue({ users: [] }) },
  reportService: { listReports: vi.fn().mockResolvedValue({ reports: [] }) },
  chatService: { getChats: vi.fn().mockResolvedValue({ chats: [] }) },
  responseService: { listResponses: vi.fn().mockResolvedValue({ responses: [] }) },
}));

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('@/components/admin/DashboardCards', () => ({
  default: ({ statsCards }) => (
    <div data-testid="dashboard-cards">{statsCards.map((c, i) => <span key={i}>{c.title}</span>)}</div>
  ),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminDashboard from './AdminDashboard';

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

describe('AdminDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminDashboard />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders dashboard cards', () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByTestId('dashboard-cards')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    render(<AdminDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
