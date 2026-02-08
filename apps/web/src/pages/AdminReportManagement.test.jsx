import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  reportService: { listReports: vi.fn().mockResolvedValue({ reports: [] }), reviewReport: vi.fn() },
  userService: { blockUser: vi.fn() },
  responseService: { deleteResponse: vi.fn(), getResponseById: vi.fn() },
}));

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('@/components/admin/reports/ReportCard', () => ({
  default: () => <div data-testid="report-card">Report</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminReportManagement from './AdminReportManagement';

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

describe('AdminReportManagement', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminReportManagement />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminReportManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('Report Management')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminReportManagement />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders status filter buttons', () => {
    render(<AdminReportManagement />, { wrapper: createWrapper() });
    expect(screen.getByText(/All/)).toBeInTheDocument();
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed/)).toBeInTheDocument();
  });

  it('shows empty state when no reports', () => {
    render(<AdminReportManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('No reports to display')).toBeInTheDocument();
  });
});
