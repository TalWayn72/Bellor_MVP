import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * Home Page - Default entry point
 * This is the page that loads when user visits the root URL
 * Redirects to Welcome page to start the onboarding flow
 */
export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to Welcome page - start of the flow
    navigate(createPageUrl('Welcome'), { replace: true });
  }, [navigate]);

  // Show splash while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center">
      <img
        src="/bellor-logo.png"
        alt="Bellør"
        className="w-48 h-auto drop-shadow-2xl animate-pulse"
      />
    </div>
  );
}