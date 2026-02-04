import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, uploadService } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '../components/onboarding/ProgressBar';
import BackButton from '../components/navigation/BackButton';

const TOTAL_STEPS = 12;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const emailFromUrl = searchParams.get('email') || '';
  const stepFromUrl = searchParams.get('step');
  
  const currentStep = stepFromUrl ? parseFloat(stepFromUrl) : 0;
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: emailFromUrl,
    nickname: '',
    date_of_birth: (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 20);
      return date.toISOString().split('T')[0];
    })(),
    location: '',
    location_city: '',
    location_state: '',
    can_currently_relocate: false,
    can_language_travel: false,
    occupation: '',
    education: '',
    occupation_education_skip_until: null,
    gender: '',
    gender_other: '',
    looking_for: '',
    profile_images: [],
    main_profile_image_url: '',
    verification_photos: [],
    verification_skip_until: null,
    sketch_method: '',
    drawing_url: '',
    drawing_skip_until: null,
    acceptedTerms: false,
    phone: '',
    phone_otp: '',
    bio: '',
    interests: []
  });

  // Load existing user data if available
  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      setFormData(prev => ({
        ...prev,
        nickname: authUser.nickname || prev.nickname,
        date_of_birth: authUser.date_of_birth || prev.date_of_birth,
        location: authUser.location || prev.location,
        location_city: authUser.location_city || prev.location_city,
        location_state: authUser.location_state || prev.location_state,
        can_currently_relocate: authUser.can_currently_relocate ?? prev.can_currently_relocate,
        can_language_travel: authUser.can_language_travel ?? prev.can_language_travel,
        occupation: authUser.occupation || prev.occupation,
        education: authUser.education || prev.education,
        gender: authUser.gender || prev.gender,
        gender_other: authUser.gender_other || prev.gender_other,
        looking_for: authUser.looking_for || prev.looking_for,
        profile_images: (authUser.profile_images && authUser.profile_images.length > 0) ? authUser.profile_images : prev.profile_images,
        main_profile_image_url: authUser.main_profile_image_url || prev.main_profile_image_url,
        verification_photos: authUser.verification_photos || prev.verification_photos,
        sketch_method: authUser.sketch_method || prev.sketch_method,
        drawing_url: authUser.drawing_url || prev.drawing_url,
        phone: authUser.phone || prev.phone,
        bio: authUser.bio || prev.bio,
        interests: (authUser.interests && authUser.interests.length > 0) ? authUser.interests : prev.interests
      }));
    }
  }, [isAuthenticated, authUser]);

  // Reload user images when reaching step 8
  React.useEffect(() => {
    if (currentStep === 8 && isAuthenticated && authUser) {
      if (authUser.profile_images && authUser.profile_images.length > 0) {
        setFormData(prev => ({
          ...prev,
          profile_images: authUser.profile_images,
          main_profile_image_url: authUser.main_profile_image_url || authUser.profile_images?.[0] || ''
        }));
      }
    }
  }, [currentStep, isAuthenticated, authUser]);
  const [verificationStream, setVerificationStream] = useState(null);
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [drawingContext, setDrawingContext] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const [drawingColor, setDrawingColor] = React.useState('#000000');
  const [drawingTool, setDrawingTool] = React.useState('pen');
  const [lineWidth, setLineWidth] = React.useState(3);

  React.useEffect(() => {
    // Auto-advance from step 0 to step 1
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        navigate(createPageUrl('Onboarding') + '?step=1', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  const handleNext = async () => {
    if (currentStep === 7.5 || currentStep === 7.7) {
      navigate(createPageUrl('Onboarding') + '?step=8');
    } else if (currentStep < 14) {
      navigate(createPageUrl('Onboarding') + '?step=' + (currentStep + 1));
    } else {
      // Save user data to database before completing
      if (!authUser) {
        alert('Please log in to complete onboarding');
        return;
      }

      setIsLoading(true);
      try {
        // Calculate age from date_of_birth
        const age = formData.date_of_birth
          ? new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear()
          : null;

        // Prepare user data to update
        const userData = {
          nickname: formData.nickname,
          age: age,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          gender_other: formData.gender_other,
          looking_for: formData.looking_for,
          location: formData.location,
          location_city: formData.location_city,
          location_state: formData.location_state,
          can_currently_relocate: formData.can_currently_relocate,
          can_language_travel: formData.can_language_travel,
          occupation: formData.occupation,
          education: formData.education,
          profile_images: formData.profile_images,
          verification_photos: formData.verification_photos,
          sketch_method: formData.sketch_method,
          drawing_url: formData.drawing_url,
          phone: formData.phone,
          bio: formData.bio,
          interests: formData.interests,
          main_profile_image_url: formData.main_profile_image_url || formData.profile_images?.[0] || '',
          last_active_date: new Date().toISOString(),
          response_count: 0,
          chat_count: 0,
          mission_completed_count: 0,
          onboarding_completed: true
        };

        // Update user with all collected data
        await userService.updateUser(authUser.id, userData);

        navigate(createPageUrl('SharedSpace'));
      } catch (error) {
        console.error('Error saving user data:', error);
        alert('Error saving data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAuthWithGoogle = () => {
    if (!isAuthenticated) {
      // Redirect directly to Google OAuth
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex-1 flex items-center justify-center bg-card">
            <img 
              src="/bellor-logo.png"
              alt="Bellør"
              className="w-64 h-auto"
            />
          </div>
        );

      case 1:
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 px-6">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="w-48 h-48 mx-auto flex items-center justify-center mb-6">
                  <img 
                    src="/bellor-logo.png"
                    alt="Bellør"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </div>
                <h2 className="text-3xl font-bold text-center mb-3 text-white">Welcome to Bellør</h2>
                <p className="text-center text-base text-white/90 mb-8">
                  A place for people<br />to tell the truth in the light
                </p>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-white/30">
                  <h3 className="font-bold text-sm mb-2 text-center text-white">🚫 No Swipe</h3>
                  <p className="text-xs text-white/90 leading-relaxed text-center">
                    At Bellør, there's no superficial swiping. We believe in authentic connections through daily shared moments and creative self-expression.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 hover:bg-gray-50 font-bold text-lg shadow-xl"
              >
                GET STARTED
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex-1 flex flex-col bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 px-6">
            <div className="w-full max-w-md mx-auto pt-12">
              <div className="w-40 h-40 mx-auto flex items-center justify-center mb-8">
                <img 
                  src="/bellor-logo.png"
                  alt="Bellør"
                  className="w-full h-auto drop-shadow-2xl"
                />
              </div>

              <h2 className="text-2xl font-bold text-center mb-8 text-white">
                {authMode === 'signup' ? 'Join Bellør' : 'Welcome Back'}
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
                    <a href="/terms" target="_blank" className="underline font-semibold">
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" className="underline font-semibold">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => navigate(createPageUrl('Onboarding') + '?step=2.3')}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 hover:from-blue-600 hover:to-blue-700 text-base font-semibold shadow-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  ⚡ Quick Login with Phone
                </button>

                <button
                  onClick={handleAuthWithGoogle}
                  className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 text-base font-semibold shadow-xl transition-all"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleAuthWithApple}
                  className="w-full h-14 bg-black rounded-2xl flex items-center justify-center gap-3 hover:bg-primary text-base font-semibold shadow-xl transition-all text-white"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </button>

                <button
                  onClick={handleAuthWithEmail}
                  className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 text-base font-semibold shadow-xl transition-all"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Continue with Email
                </button>
              </div>

              <div className="flex gap-2 mb-6 bg-white/20 backdrop-blur-sm rounded-2xl p-1 border border-white/30">
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-gray-800 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Signup
                </button>
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-gray-800 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        );

      case 2.3:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-32 h-32 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center mb-2">Quick Phone Login</h2>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  Enter your phone number and we'll send you a verification code
                </p>

                <label className="block text-sm text-muted-foreground mb-2">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+972 50 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-12 text-base mb-4"
                />

                <div className="bg-info/10 rounded-xl p-4 mb-6">
                  <p className="text-xs text-info leading-relaxed">
                    ⚡ We'll send you a one-time code to verify your number. Standard SMS rates may apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={() => {
                  if (formData.phone && formData.phone.length >= 10) {
                    // In production, this would call a backend function to send OTP
                    alert('Demo Mode: In production, an OTP will be sent to ' + formData.phone);
                    navigate(createPageUrl('Onboarding') + '?step=2.4');
                  } else {
                    alert('Please enter a valid phone number');
                  }
                }}
                disabled={!formData.phone || formData.phone.length < 10}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Code
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        );

      case 2.4:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-32 h-32 text-white opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center mb-2">Enter Verification Code</h2>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  We sent a code to {formData.phone}
                </p>

                <label className="block text-sm text-muted-foreground mb-2">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.phone_otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 6) {
                      setFormData({ ...formData, phone_otp: value });
                    }
                  }}
                  className="w-full h-12 text-base text-center text-2xl tracking-widest mb-4"
                  maxLength={6}
                />

                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      alert('Demo Mode: In production, a new OTP will be sent');
                    }}
                    className="text-sm text-info hover:text-info font-medium"
                  >
                    Didn't receive code? Send again
                  </button>
                </div>

                <div className="bg-warning/10 rounded-xl p-4 mb-6">
                  <p className="text-xs text-warning leading-relaxed">
                    <strong>Demo Mode:</strong> Backend functions are required for phone authentication. 
                    Contact support to enable this feature.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={async () => {
                  if (formData.phone_otp && formData.phone_otp.length === 6) {
                    // In production, this would verify the OTP with backend
                    // For demo, we'll just proceed to step 3
                    setIsLoading(true);
                    try {
                      // Simulate verification
                      await new Promise(resolve => setTimeout(resolve, 1000));

                      // Check if user exists or create new
                      if (!isAuthenticated) {
                        // In production, backend would handle user creation
                        alert('Demo Mode: User would be created/authenticated here');
                      }

                      navigate(createPageUrl('Onboarding') + '?step=3');
                    } catch (error) {
                      alert('Verification failed. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  } else {
                    alert('Please enter a valid 6-digit code');
                  }
                }}
                disabled={!formData.phone_otp || formData.phone_otp.length !== 6 || isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800"
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={1} totalSteps={TOTAL_STEPS} />

                <label className="block text-sm text-muted-foreground mb-2">Your nickname</label>
                <Input
                  placeholder="Nickname"
                  value={formData.nickname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9\s]/g, '');
                    if (value.length <= 15) {
                      setFormData({ ...formData, nickname: value });
                    }
                  }}
                  className="w-full h-12 text-base"
                  maxLength={15}
                />
                {formData.nickname && formData.nickname.length < 3 && (
                  <p className="text-xs text-muted-foreground mt-1">Minimum 3 characters required</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={handleNext}
                disabled={!formData.nickname || formData.nickname.length < 3 || formData.nickname.length > 15}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NEXT
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800"
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={2} totalSteps={TOTAL_STEPS} />

                <label className="block text-sm text-muted-foreground mb-2">Date of birth</label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate) {
                      const birthYear = parseInt(selectedDate.split('-')[0]);
                      const currentYear = new Date().getFullYear();
                      const minYear = currentYear - 120;
                      if (birthYear < minYear || birthYear > currentYear) {
                        return;
                      }
                    }
                    setFormData({ ...formData, date_of_birth: selectedDate });
                  }}
                  min={(() => {
                    const currentYear = new Date().getFullYear();
                    return `${currentYear - 120}-01-01`;
                  })()}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full h-12 text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">You must be between 0-120 years old</p>
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={handleNext}
                disabled={!formData.date_of_birth || (() => {
                  const year = parseInt(formData.date_of_birth.split('-')[0]);
                  const currentYear = new Date().getFullYear();
                  return year < (currentYear - 120) || year > currentYear;
                })()}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NEXT
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        );

      case 5:
        const countries = [
          { name: 'United States', code: 'US', flag: '🇺🇸', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston'] },
          { name: 'Israel', code: 'IL', flag: '🇮🇱', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva'] },
          { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', cities: ['London', 'Manchester', 'Birmingham', 'Leeds'] },
          { name: 'Canada', code: 'CA', flag: '🇨🇦', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary'] },
          { name: 'Australia', code: 'AU', flag: '🇦🇺', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'] }
        ];
        const selectedCountry = countries.find(c => c.name === formData.location) || countries[0];
        
        return (
          <div className="flex-1 flex flex-col bg-card overflow-hidden">
            <div className="flex-1 flex flex-col">
              <div className="relative h-48 bg-muted overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800"
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 px-6 py-4">
                <div className="w-full max-w-md mx-auto">
                  <ProgressBar currentStep={3} totalSteps={TOTAL_STEPS} />
                  <p className="text-sm text-muted-foreground mb-3">Location for you matching</p>

                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value, location_city: '' })}
                        className="flex-1 h-12 text-base bg-card text-card-foreground border-2 border-gray-300 rounded-lg px-3"
                      >
                        {countries.map(country => (
                          <option key={country.code} value={country.name}>{country.name}</option>
                        ))}
                      </select>
                      <div className="w-12 h-12 rounded-lg border-2 border-gray-300 bg-card flex items-center justify-center text-2xl">
                        {selectedCountry.flag}
                      </div>
                    </div>

                    <select
                      value={formData.location_city}
                      onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                      className="w-full h-12 text-base bg-card text-card-foreground border-2 border-gray-300 rounded-lg px-3"
                    >
                      <option value="">Select City</option>
                      {selectedCountry.cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">Can currently relocate?</span>
                      <button
                        onClick={() => setFormData({ ...formData, can_currently_relocate: !formData.can_currently_relocate })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.can_currently_relocate ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          formData.can_currently_relocate ? 'translate-x-6' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">Can language-travel?</span>
                      <button
                        onClick={() => setFormData({ ...formData, can_language_travel: !formData.can_language_travel })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.can_language_travel ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          formData.can_language_travel ? 'translate-x-6' : 'translate-x-1'
                        }`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex-shrink-0">
                <Button
                  onClick={handleNext}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  NEXT
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex-1 flex flex-col bg-card overflow-hidden">
            <div className="flex-1 flex flex-col">
              <div className="relative h-64 bg-muted overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800"
                  alt="Background"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 px-6 py-6 overflow-y-auto">
                <div className="w-full max-w-md mx-auto">
                  <ProgressBar currentStep={4} totalSteps={TOTAL_STEPS} />
                  <p className="text-sm text-muted-foreground mb-4">About You</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Occupation</label>
                      <Input
                        placeholder="What do you do?"
                        value={formData.occupation}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[0-9]/g, '');
                          setFormData({ ...formData, occupation: value });
                        }}
                        className="w-full h-12 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Education</label>
                      <Input
                        placeholder="Where did you study?"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        className="w-full h-12 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Phone Number</label>
                      <Input
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full h-12 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Bio</label>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full h-24 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Interests (comma separated)</label>
                      <Input
                        placeholder="Music, Art, Travel..."
                        value={formData.interests.join(', ')}
                        onChange={(e) => {
                          const interests = e.target.value.split(',').map(i => i.trim()).filter(i => i);
                          setFormData({ ...formData, interests });
                        }}
                        className="w-full h-12 text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3 flex-shrink-0">
                <Button
                  onClick={() => {
                    const skipUntil = new Date();
                    skipUntil.setHours(skipUntil.getHours() + 72);
                    setFormData({ ...formData, occupation_education_skip_until: skipUntil.toISOString() });
                    handleNext();
                  }}
                  variant="outline"
                  className="px-8 h-12 text-sm border-2 border-border"
                >
                  SKIP
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  NEXT
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src={formData.gender === 'male' 
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"
                  : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"}
                alt="Background"
                className="w-full h-full object-cover opacity-50"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
                <p className="text-sm text-muted-foreground mb-4">Gender Selection</p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, gender: 'female' });
                      navigate(createPageUrl('Onboarding') + '?step=7.7');
                    }}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>FEMALE</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, gender: 'male' });
                      navigate(createPageUrl('Onboarding') + '?step=7.7');
                    }}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>MALE</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => navigate(createPageUrl('Onboarding') + '?step=7.5')}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>OTHER</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-400"
                    disabled
                  >
                    PREFER NOT TO SAY
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 7.5:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800"
                alt="Background"
                className="w-full h-full object-cover opacity-50"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
                <p className="text-sm text-muted-foreground mb-4">Other Options</p>

                <div className="space-y-3">
                  {['GENDERQUEER', 'NON-BINARY', 'ANDROGYNE', 'TRANS', 'DEMI-BOY', 'MALE', 'OTHER', 'QUESTIONING'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setFormData({ ...formData, gender: 'other', gender_other: option });
                        navigate(createPageUrl('Onboarding') + '?step=7.7');
                      }}
                      className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={() => navigate(createPageUrl('Onboarding') + '?step=7.7')}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                NEXT
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        );

      case 7.7:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800"
                alt="Background"
                className="w-full h-full object-cover opacity-50"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
                <p className="text-sm text-muted-foreground mb-4">I'm looking for</p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setFormData({ ...formData, looking_for: 'female' });
                      handleNext();
                    }}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>WOMEN</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, looking_for: 'male' });
                      handleNext();
                    }}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>MEN</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, looking_for: 'other' });
                      handleNext();
                    }}
                    className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4"
                  >
                    <span>EVERYONE</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="relative h-80 bg-muted overflow-hidden">
              <img
                src={formData.gender === 'male' 
                  ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"
                  : "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800"}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 px-6 py-8">
              <div className="w-full max-w-md mx-auto">
                <ProgressBar currentStep={6} totalSteps={TOTAL_STEPS} />
                <p className="text-sm text-muted-foreground mb-1">Add Your Photos</p>
                <p className="text-xs text-muted-foreground mb-6">Choose unique profile for authentic you</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    const uploadedUrls = [];
                    for (const file of files) {
                      try {
                        const { file_url } = await uploadService.uploadFile(file);
                        uploadedUrls.push(file_url);
                      } catch (error) {
                        console.error('Error uploading file:', error);
                      }
                    }
                    const newImages = [...formData.profile_images, ...uploadedUrls];
                    const newMainImage = formData.main_profile_image_url || (newImages.length > 0 ? newImages[0] : '');
                    setFormData({ ...formData, profile_images: newImages, main_profile_image_url: newMainImage });

                    // Save images immediately to database
                    try {
                      if (isAuthenticated && authUser) {
                        await userService.updateUser(authUser.id, { profile_images: newImages, main_profile_image_url: newMainImage });
                      }
                    } catch (error) {
                      console.error('Error saving images to database:', error);
                    }
                  }}
                />

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative aspect-square">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-full rounded-xl bg-muted border-2 flex items-center justify-center overflow-hidden ${
                          formData.profile_images[i] && formData.main_profile_image_url === formData.profile_images[i]
                            ? 'border-primary border-4 shadow-lg'
                            : 'border-dashed border-border hover:border-border'
                        }`}
                      >
                        {formData.profile_images[i] ? (
                          <img
                            src={formData.profile_images[i]}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                      {formData.profile_images[i] && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const imageUrl = formData.profile_images[i];
                              setFormData({ ...formData, main_profile_image_url: imageUrl });

                              // Update database immediately
                              try {
                                if (isAuthenticated && authUser) {
                                  await userService.updateUser(authUser.id, { main_profile_image_url: imageUrl });
                                }
                              } catch (error) {
                                console.error('Error updating main profile image:', error);
                              }
                            }}
                            className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-10 ${
                              formData.main_profile_image_url === formData.profile_images[i]
                                ? 'bg-info/100 text-white'
                                : 'bg-white text-muted-foreground hover:bg-muted'
                            }`}
                            title="Set as main profile photo"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const deletedImage = formData.profile_images[i];
                              const newImages = formData.profile_images.filter((_, idx) => idx !== i);
                              const newMainImage = formData.main_profile_image_url === deletedImage
                                ? (newImages.length > 0 ? newImages[0] : '')
                                : formData.main_profile_image_url;
                              setFormData({ ...formData, profile_images: newImages, main_profile_image_url: newMainImage });

                              // Update database immediately
                              try {
                                if (isAuthenticated && authUser) {
                                  await userService.updateUser(authUser.id, { profile_images: newImages, main_profile_image_url: newMainImage });
                                }
                              } catch (error) {
                                console.error('Error updating images in database:', error);
                              }
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-lg z-10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              <Button
                onClick={handleNext}
                disabled={formData.profile_images.length === 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NEXT
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <ProgressBar currentStep={7} totalSteps={TOTAL_STEPS} />

                <div className="relative bg-primary rounded-3xl overflow-hidden mb-6" style={{ aspectRatio: '3/4' }}>
                  {verificationPhoto ? (
                    <img
                      src={verificationPhoto}
                      alt="Verification"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {!verificationStream && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                    </>
                  )}
                  
                  {verificationStream && !verificationPhoto && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={() => {
                          const video = videoRef.current;
                          const canvas = document.createElement('canvas');
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(video, 0, 0);
                          const dataUrl = canvas.toDataURL('image/jpeg');
                          setVerificationPhoto(dataUrl);
                          verificationStream.getTracks().forEach(track => track.stop());
                          setVerificationStream(null);
                        }}
                        className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center hover:bg-muted"
                      >
                        <div className="w-16 h-16 rounded-full bg-primary"></div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-muted rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-sm mb-2">Photo Verification</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Take a selfie that matches your profile photos. This helps verify your identity.
                  </p>
                </div>

                <div className="flex gap-3">
                  {verificationPhoto ? (
                    <>
                      <Button
                        onClick={() => {
                          setVerificationPhoto(null);
                          navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                            setVerificationStream(stream);
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                          });
                        }}
                        variant="outline"
                        className="px-8 h-12 text-sm border-2 border-border"
                      >
                        RETAKE
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        NEXT
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          const skipUntil = new Date();
                          skipUntil.setHours(skipUntil.getHours() + 72);
                          setFormData({ ...formData, verification_skip_until: skipUntil.toISOString() });
                          handleNext();
                        }}
                        variant="outline"
                        className="px-8 h-12 text-sm border-2 border-border"
                      >
                        SKIP
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                            setVerificationStream(stream);
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                          } catch (error) {
                            console.error('Error accessing camera:', error);
                            alert('לא ניתן לגשת למצלמה');
                          }
                        }}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        START CAMERA
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-8">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <div className="bg-muted rounded-2xl p-6 mb-6 text-left">
                  <h3 className="font-bold text-base mb-4">Photo Verification</h3>
                  <p className="text-sm text-foreground leading-relaxed mb-4">
                    <strong>Is the real you, we want to see!</strong>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Take a selfie that matches one of the photos on your profile. Once verified, a badge like this one will appear in your profile.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    <strong>Important to know:</strong>
                  </p>
                  <ul className="text-xs text-muted-foreground leading-relaxed space-y-2 list-disc pl-4">
                    <li>Your verification photo will be visible on your profile (to help match it to all your profile pictures)</li>
                    <li>It may take up to 48hrs for our team to review your photo</li>
                    <li>Your verification photo will not be used for anything else</li>
                    <li><strong>If you skip now, you must complete verification within 72 hours</strong></li>
                    <li>You won't receive a verification badge until completed</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="px-8 h-12 text-sm border-2 border-border"
                  >
                    SKIP IT
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    VERIFY NOW
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <ProgressBar currentStep={8} totalSteps={TOTAL_STEPS} />

                <div className="relative bg-white rounded-3xl overflow-hidden mb-6 border-4 border-success" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={verificationPhoto || (formData.gender === 'male' 
                      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400")}
                    alt="Verified"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-2xl border-4 border-white">
                      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  NEXT
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 12:
        return (
          <div className="min-h-screen flex flex-col bg-card relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"
                alt="Background"
                className="w-full h-full object-cover"
                style={{ filter: 'grayscale(100%)' }}
              />
            </div>

            <BackButton onClick={handleBack} className="top-6 right-6" />

            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
              <h1 className="text-xl font-bold">Bellør</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
              <div className="w-full max-w-md">
                <h2 className="text-xl font-bold text-center mb-6">Choose your Sketch Mode</h2>

                <ProgressBar currentStep={9} totalSteps={TOTAL_STEPS} />

                <div className="bg-white rounded-3xl p-5 shadow-lg">
                  <h3 className="text-base font-bold mb-3">Draw Your Choice</h3>
                  <p className="text-xs text-muted-foreground mb-4">Express your choice in a simple sketch</p>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, sketch_method: 'self' });
                      handleNext();
                    }}
                    className="w-full bg-muted rounded-xl p-3 mb-3 border-2 border-transparent hover:border-primary cursor-pointer transition-all text-left"
                  >
                    <h4 className="font-semibold text-xs mb-1">Self-Expression</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Draw something that reflect your vibe, personality, lifestyle, or anything that symbolizes you
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setFormData({ ...formData, sketch_method: 'guess' });
                      handleNext();
                    }}
                    className="w-full bg-muted rounded-xl p-3 mb-4 border-2 border-transparent hover:border-primary cursor-pointer transition-all text-left"
                  >
                    <h4 className="font-semibold text-xs mb-1">Let Others Guess</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your sketch becomes a mystery! Others will try to guess what you drew
                    </p>
                  </button>

                  <Button
                    onClick={() => {
                      setFormData({ ...formData, sketch_method: 'draw' });
                      handleNext();
                    }}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  >
                    NEXT
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="flex-1 flex flex-col bg-card">
            <BackButton onClick={handleBack} className="top-6 right-6" />

            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
              <h1 className="text-xl font-bold">Bellør</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20">
              <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-8">Draw Your Choice</h2>

                <ProgressBar currentStep={10} totalSteps={TOTAL_STEPS} />

                <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                  <div className="bg-muted rounded-2xl p-4 mb-4">
                    <h4 className="font-semibold text-sm mb-2">Important to know</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You can draw anything you want ✓ Your sketch will appear on your profile ✓ You must complete this step ✓
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-border mb-4 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={500}
                      className="w-full touch-none bg-white"
                      onMouseDown={(e) => {
                        setIsDrawing(true);
                        const canvas = canvasRef.current;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const ctx = canvas.getContext('2d');
                        ctx.beginPath();
                        ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                        setDrawingContext(ctx);
                      }}
                      onMouseMove={(e) => {
                        if (!isDrawing || !drawingContext) return;
                        const canvas = canvasRef.current;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        drawingContext.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                        drawingContext.strokeStyle = drawingTool === 'eraser' ? '#FFFFFF' : drawingColor;
                        drawingContext.lineWidth = drawingTool === 'eraser' ? lineWidth * 3 : lineWidth;
                        drawingContext.lineCap = 'round';
                        drawingContext.stroke();
                      }}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsDrawing(true);
                        const canvas = canvasRef.current;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const ctx = canvas.getContext('2d');
                        const touch = e.touches[0];
                        ctx.beginPath();
                        ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                        setDrawingContext(ctx);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        if (!isDrawing || !drawingContext) return;
                        const canvas = canvasRef.current;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const touch = e.touches[0];
                        drawingContext.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                        drawingContext.strokeStyle = drawingTool === 'eraser' ? '#FFFFFF' : drawingColor;
                        drawingContext.lineWidth = drawingTool === 'eraser' ? lineWidth * 3 : lineWidth;
                        drawingContext.lineCap = 'round';
                        drawingContext.stroke();
                      }}
                      onTouchEnd={() => setIsDrawing(false)}
                    />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setDrawingTool('pen')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          drawingTool === 'pen' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDrawingTool('eraser')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          drawingTool === 'eraser' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const canvas = canvasRef.current;
                          if (!canvas) return;
                          const ctx = canvas.getContext('2d');
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }}
                        className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20"
                      >
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex gap-2 justify-center">
                      {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            setDrawingColor(color);
                            setDrawingTool('pen');
                          }}
                          className={`w-8 h-8 rounded-full border-2 ${
                            drawingColor === color && drawingTool === 'pen' ? 'border-gray-900' : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-3 justify-center">
                      <span className="text-xs text-muted-foreground">Line Width:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                        className="w-32"
                      />
                      <span className="text-xs text-muted-foreground">{lineWidth}px</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        const skipUntil = new Date();
                        skipUntil.setHours(skipUntil.getHours() + 72);
                        setFormData({ ...formData, drawing_skip_until: skipUntil.toISOString() });
                        navigate(createPageUrl('Onboarding') + '?step=14');
                      }}
                      variant="outline"
                      className="flex-1 h-12 text-sm border-2 border-border rounded-xl"
                    >
                      <span className="text-xs">SKIP ⏱️<br />for 72 hours</span>
                    </Button>
                    <Button
                      onClick={async () => {
                        const canvas = canvasRef.current;
                        setIsLoading(true);

                        try {
                          // Convert canvas to blob and upload using dedicated drawing endpoint
                          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                          const file = new File([blob], 'drawing.png', { type: 'image/png' });

                          // Use uploadDrawing instead of uploadFile to save to drawingUrl (not profileImages!)
                          const result = await uploadService.uploadDrawing(file);

                          // Save drawing URL to form data
                          setFormData({ ...formData, drawing_url: result.url });
                        } catch (error) {
                          console.error('Error saving drawing:', error);
                          alert('Error saving drawing. Please try again.');
                          setIsLoading(false);
                          return;
                        }

                        setIsLoading(false);
                        handleNext();
                      }}
                      disabled={isLoading}
                      className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          SAVE
                          <ArrowRight className="w-4 h-4 mr-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className="flex-1 flex flex-col bg-card relative">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800"
                alt="Background"
                className="w-full h-full object-cover"
                style={{ filter: 'grayscale(100%)' }}
              />
            </div>

            <BackButton onClick={handleBack} className="top-6 right-6" />

            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
              <h1 className="text-xl font-bold">Bellør</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-8">Your First Question</h2>

                <ProgressBar currentStep={11} totalSteps={TOTAL_STEPS} />

                <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
                  <h3 className="text-lg font-semibold mb-6 text-center">
                    How do you usually express yourself?
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={() => navigate(createPageUrl('VideoTask'))}
                      className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                    >
                      <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        setFormData({ ...formData, sketch_method: 'draw' });
                        navigate(createPageUrl('Onboarding') + '?step=13');
                      }}
                      className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                    >
                      <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => navigate(createPageUrl('WriteTask'))}
                      className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                    >
                      <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => navigate(createPageUrl('AudioTask'))}
                      className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all"
                    >
                      <svg className="w-10 h-10 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        MEET PEOPLE
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const showBackButton = currentStep > 2;

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="ltr">
      {showBackButton && <BackButton onClick={handleBack} />}

      {renderStep()}
    </div>
  );
}