import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { apiClient } from '@/api/client/apiClient';

// Google Icon SVG component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const oauthError = searchParams.get('error');
  const { login, register, isLoadingAuth } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  // Check if Google OAuth is enabled
  useEffect(() => {
    const checkOAuthStatus = async () => {
      try {
        const response = await apiClient.get('/oauth/status');
        const data = response.data.data || response.data;
        setIsGoogleEnabled(data.google === true);
      } catch (err) {
        console.log('OAuth status check failed:', err);
        setIsGoogleEnabled(false);
      }
    };

    checkOAuthStatus();
  }, []);

  // Handle OAuth error from redirect
  useEffect(() => {
    if (oauthError) {
      const errorMessages = {
        oauth_denied: 'Login was cancelled',
        no_code: 'Authentication failed - no code received',
        account_blocked: 'Your account has been deactivated',
        oauth_failed: 'Authentication failed. Please try again.',
      };
      setError(errorMessages[oauthError] || 'An error occurred during login');
    }
  }, [oauthError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          birthDate: new Date('1990-01-01'), // Default, will be updated in onboarding
          gender: 'OTHER', // Default, will be updated in onboarding
        });
      }

      // Navigate to return URL or home
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(createPageUrl('Home'));
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    // Redirect to backend Google OAuth endpoint
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const googleAuthUrl = `${apiUrl}/oauth/google${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    window.location.href = googleAuthUrl;
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/bellor-logo.png"
            alt="Bellor"
            className="w-24 h-auto mx-auto mb-4 drop-shadow-xl"
          />
          <h1 className="text-3xl font-bold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/80 mt-2">
            {mode === 'login'
              ? 'Sign in to continue to Bellor'
              : 'Join Bellor to find meaningful connections'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Google Login Button */}
          {isGoogleEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="ml-3">Continue with Google</span>
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-muted-foreground">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Registration fields */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required={mode === 'register'}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required={mode === 'register'}
                    className="h-12"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full h-12 text-lg font-semibold"
            >
              {isLoadingAuth ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6">
            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Guest Option */}
          <div className="mt-4 pt-4 border-t border-muted">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('Welcome'))}
              className="w-full h-12"
            >
              <User className="w-5 h-5 mr-2" />
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-white/70 mt-6">
          By continuing, you agree to our{' '}
          <a href="/TermsOfService" className="underline hover:text-white">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/PrivacyPolicy" className="underline hover:text-white">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
