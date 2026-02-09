import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/utils';
import { Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { apiClient } from '@/api/client/apiClient';
import GoogleIcon from '@/components/auth/GoogleIcon';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const oauthError = searchParams.get('error');
  const { login, register, isLoadingAuth } = useAuth();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '' });

  useEffect(() => {
    const checkOAuthStatus = async () => {
      try { const response = await apiClient.get('/oauth/status'); const data = response.data.data || response.data; setIsGoogleEnabled(data.google === true); }
      catch { setIsGoogleEnabled(false); }
    };
    checkOAuthStatus();
  }, []);

  useEffect(() => {
    if (oauthError) {
      const errorMessages = { oauth_denied: 'Login was cancelled', no_code: 'Authentication failed - no code received', account_blocked: 'Your account has been deactivated', oauth_failed: 'Authentication failed. Please try again.' };
      setError(errorMessages[oauthError] || 'An error occurred during login');
    }
  }, [oauthError]);

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') { await login({ email: formData.email, password: formData.password }); }
      else { await register({ email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, birthDate: new Date('1990-01-01'), gender: 'OTHER' }); }
      navigate(returnUrl || createPageUrl('Home'));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Authentication failed. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/oauth/google${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
  };

  const toggleMode = () => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/bellor-logo.png" alt="Bellor" className="w-24 h-auto mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-3xl font-bold text-white">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-white/80 mt-2">{mode === 'login' ? 'Sign in to continue to Bellor' : 'Join Bellor to find meaningful connections'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {isGoogleEnabled && (
            <>
              <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={isGoogleLoading} className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50">
                {isGoogleLoading ? (<div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />) : (<><GoogleIcon /><span className="ml-3">Continue with Google</span></>)}
              </Button>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-muted" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-muted-foreground">or continue with email</span></div></div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" name="firstName" type="text" placeholder="John" value={formData.firstName} onChange={handleChange} required={mode === 'register'} className="h-12" /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" name="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={handleChange} required={mode === 'register'} className="h-12" /></div>
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="h-12" /></div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} required minLength={8} className="h-12 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
              {mode === 'register' && (<p className="text-xs text-muted-foreground">Password must be at least 8 characters with uppercase, lowercase, number, and special character</p>)}
            </div>
            {error && (<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">{error}</div>)}
            <Button type="submit" disabled={isLoadingAuth} className="w-full h-12 text-lg font-semibold">
              {isLoadingAuth ? (<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5 ml-2" /></>)}
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (<>Don't have an account?{' '}<button type="button" onClick={toggleMode} className="text-primary font-semibold hover:underline">Sign up</button></>) : (<>Already have an account?{' '}<button type="button" onClick={toggleMode} className="text-primary font-semibold hover:underline">Sign in</button></>)}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-muted"><Button type="button" variant="outline" onClick={() => navigate(createPageUrl('Welcome'))} className="w-full h-12"><User className="w-5 h-5 mr-2" />Continue as Guest</Button></div>
        </div>
        <p className="text-center text-sm text-white/70 mt-6">By continuing, you agree to our{' '}<Link to="/TermsOfService" className="underline hover:text-white">Terms of Service</Link>{' '}and{' '}<Link to="/PrivacyPolicy" className="underline hover:text-white">Privacy Policy</Link></p>
      </div>
    </div>
  );
}
