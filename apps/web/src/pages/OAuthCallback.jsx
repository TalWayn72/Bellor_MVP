import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tokenStorage } from '@/api/client/tokenStorage';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { reportAuthCheckFailed } from '@/security/securityEventReporter';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const { checkUserAuth } = useAuth();
  const redirectTimerRef = React.useRef(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const returnUrl = searchParams.get('returnUrl');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          const errorMessages = {
            oauth_denied: 'OAuth login was cancelled',
            no_code: 'No authorization code received',
            account_blocked: 'Your account has been deactivated',
            oauth_failed: 'OAuth login failed. Please try again.',
          };
          reportAuthCheckFailed('OAuthCallback', undefined);
          setError(errorMessages[errorParam] || 'An error occurred during login');
          if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = setTimeout(() => {
            navigate(createPageUrl('Onboarding') + '?step=2');
          }, 3000);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError('Missing authentication tokens');
          if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = setTimeout(() => {
            navigate(createPageUrl('Onboarding') + '?step=2');
          }, 3000);
          return;
        }

        // Store the tokens
        tokenStorage.setTokens(accessToken, refreshToken);

        // Update auth context with the new tokens
        await checkUserAuth();

        // Redirect based on user status
        if (returnUrl) {
          // Has return URL - go there (usually Onboarding?step=3)
          navigate(returnUrl);
        } else if (isNewUser) {
          // New user without returnUrl - go to onboarding step 3
          navigate(createPageUrl('Onboarding') + '?step=3');
        } else {
          // Existing user - go to home
          navigate(createPageUrl('Home'));
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        reportAuthCheckFailed('OAuthCallback.catch', err?.response?.status);
        setError('An error occurred during login');
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = setTimeout(() => {
          navigate(createPageUrl('Onboarding') + '?step=2');
        }, 3000);
      }
    };

    handleCallback();

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [searchParams, navigate, checkUserAuth]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Login Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Completing Sign In</h2>
        <p className="text-muted-foreground">Please wait while we set up your account...</p>
      </div>
    </div>
  );
}
