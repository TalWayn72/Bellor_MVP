import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StepAuth({ formData, setFormData, isAuthenticated }) {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login');

  const handleAuthWithGoogle = () => {
    if (!isAuthenticated) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const returnUrl = createPageUrl('Onboarding') + '?step=3';
      window.location.href = `${apiUrl}/oauth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
    } else {
      navigate(createPageUrl('Onboarding') + '?step=3');
    }
  };

  const handleAuthWithApple = () => {
    if (!isAuthenticated) {
      navigate(createPageUrl('Login') + '?returnUrl=' + encodeURIComponent(createPageUrl('Onboarding') + '?step=3'));
    } else {
      navigate(createPageUrl('Onboarding') + '?step=3');
    }
  };

  const handleAuthWithEmail = () => {
    if (!isAuthenticated) {
      navigate(createPageUrl('Login') + '?returnUrl=' + encodeURIComponent(createPageUrl('Onboarding') + '?step=3'));
    } else {
      navigate(createPageUrl('Onboarding') + '?step=3');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 px-6">
      <div className="w-full max-w-md mx-auto pt-12">
        <div className="w-40 h-40 mx-auto flex items-center justify-center mb-8">
          <img src="/bellor-logo.png" alt="Bell\u00f8r" className="w-full h-auto drop-shadow-2xl" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-8 text-white">
          {authMode === 'signup' ? 'Join Bell\u00f8r' : 'Welcome Back'}
        </h2>

        {authMode === 'signup' && (
          <div className="mb-6 flex items-start gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <input
              type="checkbox"
              id="terms"
              checked={formData.acceptedTerms || false}
              onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
              className="mt-1 w-4 h-4"
            />
            <label htmlFor="terms" className="text-xs text-white">
              I agree to the{' '}
              <a href="/terms" target="_blank" className="underline font-semibold">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" className="underline font-semibold">Privacy Policy</a>
            </label>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button onClick={() => navigate(createPageUrl('Onboarding') + '?step=2.3')} className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 hover:from-blue-600 hover:to-blue-700 text-base font-semibold shadow-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Quick Login with Phone
          </button>

          <button onClick={handleAuthWithGoogle} className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 text-base font-semibold shadow-xl transition-all">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button onClick={handleAuthWithApple} className="w-full h-14 bg-black rounded-2xl flex items-center justify-center gap-3 hover:bg-primary text-base font-semibold shadow-xl transition-all text-white">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>

          <button onClick={handleAuthWithEmail} className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 text-base font-semibold shadow-xl transition-all">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Continue with Email
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-white/20 backdrop-blur-sm rounded-2xl p-1 border border-white/30">
          <button onClick={() => setAuthMode('signup')} className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${authMode === 'signup' ? 'bg-white text-gray-800 shadow-lg' : 'text-white hover:bg-white/10'}`}>
            Signup
          </button>
          <button onClick={() => setAuthMode('login')} className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-white text-gray-800 shadow-lg' : 'text-white hover:bg-white/10'}`}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
