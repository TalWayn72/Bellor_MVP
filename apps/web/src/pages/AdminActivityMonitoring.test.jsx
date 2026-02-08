import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue({ users: [] }) },
}));

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/admin/ActivityFeed', () => ({
  default: () => <div data-testid="activity-feed">Activity</div>,
  getActivityStatus: vi.fn(() => 'active'),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminActivityMonitoring from './AdminActivityMonitoring';

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

describe('AdminActivityMonitoring', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminActivityMonitoring />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminActivityMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Activity Monitoring')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminActivityMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders activity stat cards', () => {
    render(<AdminActivityMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Highly Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders activity distribution section', () => {
    render(<AdminActivityMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Activity Distribution')).toBeInTheDocument();
  });
});
