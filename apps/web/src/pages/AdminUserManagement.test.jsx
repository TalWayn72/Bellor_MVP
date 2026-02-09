import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { searchUsers: vi.fn().mockResolvedValue({ users: [] }), blockUser: vi.fn(), unblockUser: vi.fn(), updateProfile: vi.fn() },
  responseService: { listResponses: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('@/components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('@/components/admin/users/UserFilters', () => ({
  default: () => <div data-testid="user-filters">Filters</div>,
}));

vi.mock('@/components/admin/users/UserTable', () => ({
  default: () => <div data-testid="user-table">Table</div>,
}));

vi.mock('@/components/admin/users/UserDetailModal', () => ({
  default: () => <div data-testid="user-detail-modal">Modal</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminUserManagement from './AdminUserManagement';

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

describe('AdminUserManagement', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminUserManagement />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminUserManagement />, { wrapper: createWrapper() });
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminUserManagement />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders user filters', () => {
    render(<AdminUserManagement />, { wrapper: createWrapper() });
    expect(screen.getByTestId('user-filters')).toBeInTheDocument();
  });

  it('renders user table', async () => {
    render(<AdminUserManagement />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('user-table')).toBeInTheDocument();
  });
});
