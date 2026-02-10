import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
  useLocation: vi.fn(() => ({ pathname: '/TestRoute' })),
}));

vi.mock('@/security/securityEventReporter', () => ({
  reportAuthRedirect: vi.fn(),
  reportAdminDenied: vi.fn(),
}));

import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { reportAuthRedirect, reportAdminDenied } from '@/security/securityEventReporter';
import ProtectedRoute from './ProtectedRoute';

describe('[P0][auth] ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when isLoadingAuth is true', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoadingAuth: true,
    });

    render(
      <ProtectedRoute>
        <div>Child Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
    expect(Navigate).not.toHaveBeenCalled();
  });

  it('redirects to /Welcome when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div>Child Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/Welcome');
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: '1', is_admin: false },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div>Child Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(Navigate).not.toHaveBeenCalled();
  });

  it('redirects to / when requireAdmin is true but user is not admin', () => {
    useAuth.mockReturnValue({
      user: { id: '1', is_admin: false },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when requireAdmin is true and user is admin (snake_case)', () => {
    useAuth.mockReturnValue({
      user: { id: '1', is_admin: true },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(Navigate).not.toHaveBeenCalled();
  });

  it('regression: rejects admin access when only camelCase isAdmin is set (API transformer bug)', () => {
    useAuth.mockReturnValue({
      user: { id: '1', isAdmin: true, is_admin: false },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('reports auth redirect to backend when unauthenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(reportAuthRedirect).toHaveBeenCalledWith('/TestRoute', '/Welcome');
  });

  it('reports admin denied to backend when non-admin accesses admin route', () => {
    const mockUser = { id: '1', is_admin: false };
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(reportAdminDenied).toHaveBeenCalledWith('/TestRoute', '/', mockUser);
  });

  it('does not report when access is granted', () => {
    useAuth.mockReturnValue({
      user: { id: '1', is_admin: true },
      isAuthenticated: true,
      isLoadingAuth: false,
    });

    render(
      <ProtectedRoute requireAdmin>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(reportAuthRedirect).not.toHaveBeenCalled();
    expect(reportAdminDenied).not.toHaveBeenCalled();
  });
});
