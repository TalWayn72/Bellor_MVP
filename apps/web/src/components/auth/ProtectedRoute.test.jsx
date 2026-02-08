import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
}));

import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
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

  it('redirects to /Login when not authenticated', () => {
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

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/Login');
    expect(screen.queryByText('Child Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({
      user: { id: '1', isAdmin: false },
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
      user: { id: '1', isAdmin: false },
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

  it('renders children when requireAdmin is true and user is admin', () => {
    useAuth.mockReturnValue({
      user: { id: '1', isAdmin: true },
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
});
