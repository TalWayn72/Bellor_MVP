import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simple timeout - always go to Onboarding Sign In page after splash
    const timer = setTimeout(() => {
      navigate(createPageUrl('Onboarding') + '?step=2');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center">
      <div className="text-center">
        <img
          src="/bellor-logo.png"
          alt="Bellør"
          className="w-64 h-auto mx-auto mb-8 drop-shadow-2xl animate-pulse"
        />
        <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">Bellør</h1>
        <p className="text-white/80 text-lg mb-8">Authentic Connections</p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 bg-white/90 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}