import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { reportAuthRedirect, reportAdminDenied } from '@/security/securityEventReporter';

/**
 * ProtectedRoute - Guards routes that require authentication.
 * Shows a loading spinner while auth state is resolving.
 * Redirects unauthenticated users to /Welcome.
 * Optionally requires admin role.
 * Reports all redirects to backend security logs for diagnostics.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (import.meta.env.DEV) {
      console.warn('[ProtectedRoute] Unauthenticated access, redirecting to /Welcome');
    }
    reportAuthRedirect(location.pathname, '/Welcome');
    return <Navigate to="/Welcome" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    if (import.meta.env.DEV) {
      console.warn('[ProtectedRoute] Non-admin user attempted admin route, redirecting to /');
    }
    reportAdminDenied(location.pathname, '/', user);
    return <Navigate to="/" replace />;
  }

  return children;
}
