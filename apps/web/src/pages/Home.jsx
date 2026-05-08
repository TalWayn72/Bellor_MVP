import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

/**
 * Home Page - Default entry point.
 * Redirects users to the correct authenticated or public entry point.
 */
export default function Home() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center">
        <img
          src="/bellor-logo.png"
          alt="Bellor"
          className="w-48 h-auto drop-shadow-2xl animate-pulse"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={createPageUrl('Welcome')} replace />;
  }

  return (
    <Navigate
      to={createPageUrl(user?.is_admin ? 'AdminDashboard' : 'SharedSpace')}
      replace
    />
  );
}
