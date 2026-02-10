import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { userService } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import BackButton from '@/components/navigation/BackButton';
import { formatDateForInput, validateDateOfBirth, TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import StepSplash from '@/components/onboarding/steps/StepSplash';
import StepWelcome from '@/components/onboarding/steps/StepWelcome';
import StepAuth from '@/components/onboarding/steps/StepAuth';
import StepPhoneLogin from '@/components/onboarding/steps/StepPhoneLogin';
import StepPhoneVerify from '@/components/onboarding/steps/StepPhoneVerify';
import StepNickname from '@/components/onboarding/steps/StepNickname';
import StepBirthDate from '@/components/onboarding/steps/StepBirthDate';
import StepLocation from '@/components/onboarding/steps/StepLocation';
import StepAboutYou from '@/components/onboarding/steps/StepAboutYou';
import StepGender from '@/components/onboarding/steps/StepGender';
import StepPhotos from '@/components/onboarding/steps/StepPhotos';
import StepVerification from '@/components/onboarding/steps/StepVerification';
import StepSketchMode from '@/components/onboarding/steps/StepSketchMode';
import StepDrawing from '@/components/onboarding/steps/StepDrawing';
import StepFirstQuestion from '@/components/onboarding/steps/StepFirstQuestion';
import { useToast } from '@/components/ui/use-toast';

export default function Onboarding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const stepFromUrl = searchParams.get('step');
  const currentStep = stepFromUrl ? parseFloat(stepFromUrl) : 0;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: emailFromUrl, nickname: '', date_of_birth: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 20); return d.toISOString().split('T')[0]; })(),
    location: '', location_city: '', location_state: '', can_currently_relocate: false, can_language_travel: false,
    occupation: '', education: '', occupation_education_skip_until: null, gender: '', gender_other: '', looking_for: '',
    profile_images: [], main_profile_image_url: '', verification_photos: [], verification_skip_until: null,
    sketch_method: '', drawing_url: '', drawing_skip_until: null, acceptedTerms: false, phone: '', phone_otp: '', bio: '', interests: []
  });

  useEffect(() => {
    if (isAuthenticated && authUser) {
      setFormData(prev => ({
        ...prev, nickname: authUser.nickname || prev.nickname,
        date_of_birth: formatDateForInput(authUser.birth_date) || prev.date_of_birth,
        location: typeof authUser.location === 'object' ? authUser.location?.city : (authUser.location || prev.location),
        location_city: authUser.location?.city || authUser.location_city || prev.location_city,
        location_state: authUser.location?.country || authUser.location_state || prev.location_state,
        gender: authUser.gender || prev.gender,
        looking_for: Array.isArray(authUser.looking_for) ? authUser.looking_for[0] : (authUser.looking_for || prev.looking_for),
        profile_images: (authUser.profile_images?.length > 0) ? authUser.profile_images : prev.profile_images,
        main_profile_image_url: authUser.profile_images?.[0] || prev.main_profile_image_url,
        sketch_method: authUser.sketch_method || prev.sketch_method, drawing_url: authUser.drawing_url || prev.drawing_url,
        bio: authUser.bio || prev.bio,
      }));
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    if (currentStep === 8 && isAuthenticated && authUser?.profile_images?.length > 0) {
      setFormData(prev => ({ ...prev, profile_images: authUser.profile_images, main_profile_image_url: authUser.main_profile_image_url || authUser.profile_images?.[0] || '' }));
    }
  }, [currentStep, isAuthenticated, authUser]);

  useEffect(() => {
    if (currentStep === 0 && location.pathname.includes('Onboarding')) {
      const timer = setTimeout(() => navigate(createPageUrl('Onboarding') + '?step=1', { replace: true }), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate, location.pathname]);

  const saveProfileData = async (partialData) => {
    if (!authUser?.id) return false;
    try { await userService.updateUser(authUser.id, partialData); return true; } catch (error) { console.error('[ONBOARDING] Partial save failed:', error); return false; }
  };

  const handleNext = async () => {
    if (currentStep === 7.5 || currentStep === 7.7) { navigate(createPageUrl('Onboarding') + '?step=8'); }
    else if (currentStep < 14) {
      if (authUser?.id) {
        if (currentStep === 3 && formData.nickname) await saveProfileData({ nickname: formData.nickname });
        if (currentStep === 4 && formData.date_of_birth) await saveProfileData({ birthDate: formData.date_of_birth });
        if (currentStep === 5 && formData.gender) await saveProfileData({ gender: formData.gender });
        if (currentStep === 6 && formData.looking_for) { const arr = Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for]; await saveProfileData({ lookingFor: arr }); }
        if (currentStep === 8 && formData.profile_images?.length > 0) await saveProfileData({ profileImages: formData.profile_images });
      }
      navigate(createPageUrl('Onboarding') + '?step=' + (currentStep + 1));
    } else {
      if (!authUser) { toast({ title: 'Error', description: 'Please log in to complete onboarding', variant: 'destructive' }); return; }
      if (!authUser.id) { toast({ title: 'Error', description: 'User ID not found. Please log out and log in again.', variant: 'destructive' }); return; }
      setIsLoading(true);
      try {
        const dateValidation = validateDateOfBirth(formData.date_of_birth);
        if (!dateValidation.isValid) { toast({ title: 'Validation', description: `Invalid date of birth: ${dateValidation.error}`, variant: 'destructive' }); setIsLoading(false); return; }
        const lookingForArray = formData.looking_for ? (Array.isArray(formData.looking_for) ? formData.looking_for : [formData.looking_for]) : [];
        const userData = {
          nickname: formData.nickname, birthDate: formData.date_of_birth, gender: formData.gender, lookingFor: lookingForArray,
          location: formData.location_city && formData.location_state ? { city: formData.location_city, country: formData.location_state } : formData.location,
          profileImages: formData.profile_images || [], sketchMethod: formData.sketch_method, drawingUrl: formData.drawing_url,
          bio: formData.bio, lastActiveAt: new Date().toISOString(),
        };
        await userService.updateUser(authUser.id, userData);
        navigate(createPageUrl('SharedSpace'));
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Error saving data. Please try again.';
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => navigate(-1);

  const stepProps = { formData, setFormData, handleNext, handleBack, isLoading, setIsLoading, navigate, isAuthenticated, authUser };

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepSplash />;
      case 1: return <StepWelcome {...stepProps} />;
      case 2: return <StepAuth {...stepProps} />;
      case 2.3: return <StepPhoneLogin {...stepProps} />;
      case 2.4: return <StepPhoneVerify {...stepProps} />;
      case 3: return <StepNickname {...stepProps} />;
      case 4: return <StepBirthDate {...stepProps} />;
      case 5: return <StepLocation {...stepProps} />;
      case 6: return <StepAboutYou {...stepProps} />;
      case 7: return <StepGender {...stepProps} subStep={7} />;
      case 7.5: return <StepGender {...stepProps} subStep={7.5} />;
      case 7.7: return <StepGender {...stepProps} subStep={7.7} />;
      case 8: return <StepPhotos {...stepProps} />;
      case 9: return <StepVerification {...stepProps} subStep={9} />;
      case 10: return <StepVerification {...stepProps} subStep={10} />;
      case 11: return <StepVerification {...stepProps} subStep={11} />;
      case 12: return <StepSketchMode {...stepProps} />;
      case 13: return <StepDrawing {...stepProps} />;
      case 14: return <StepFirstQuestion {...stepProps} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" dir="ltr">
      {currentStep > 2 && <BackButton onClick={handleBack} />}
      {renderStep()}
    </div>
  );
}
