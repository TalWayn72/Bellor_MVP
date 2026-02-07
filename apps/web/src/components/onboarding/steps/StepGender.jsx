import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { createPageUrl } from '@/utils';

const ChevronIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default function StepGender({ formData, setFormData, handleNext, subStep }) {
  const navigate = useNavigate();

  if (subStep === 7.5) {
    return (
      <div className="flex-1 flex flex-col bg-card">
        <div className="relative h-80 bg-muted overflow-hidden">
          <img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800" alt="Background" className="w-full h-full object-cover opacity-50" />
        </div>
        <div className="flex-1 px-6 py-8">
          <div className="w-full max-w-md mx-auto">
            <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
            <p className="text-sm text-muted-foreground mb-4">Other Options</p>
            <div className="space-y-3">
              {['GENDERQUEER', 'NON-BINARY', 'ANDROGYNE', 'TRANS', 'DEMI-BOY', 'MALE', 'OTHER', 'QUESTIONING'].map((option) => (
                <button key={option} onClick={() => { setFormData({ ...formData, gender: 'other', gender_other: option }); navigate(createPageUrl('Onboarding') + '?step=7.7'); }} className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800">
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <Button onClick={() => navigate(createPageUrl('Onboarding') + '?step=7.7')} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground">
            NEXT
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (subStep === 7.7) {
    return (
      <div className="flex-1 flex flex-col bg-card">
        <div className="relative h-80 bg-muted overflow-hidden">
          <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800" alt="Background" className="w-full h-full object-cover opacity-50" />
        </div>
        <div className="flex-1 px-6 py-8">
          <div className="w-full max-w-md mx-auto">
            <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
            <p className="text-sm text-muted-foreground mb-4">I'm looking for</p>
            <div className="space-y-3">
              {[{ label: 'WOMEN', value: 'female' }, { label: 'MEN', value: 'male' }, { label: 'EVERYONE', value: 'other' }].map(({ label, value }) => (
                <button key={value} onClick={() => { setFormData({ ...formData, looking_for: value }); handleNext(); }} className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4">
                  <span>{label}</span>
                  <ChevronIcon />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: subStep === 7
  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="relative h-80 bg-muted overflow-hidden">
        <img src={formData.gender === 'male' ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800" : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"} alt="Background" className="w-full h-full object-cover opacity-50" />
      </div>
      <div className="flex-1 px-6 py-8">
        <div className="w-full max-w-md mx-auto">
          <ProgressBar currentStep={5} totalSteps={TOTAL_STEPS} />
          <p className="text-sm text-muted-foreground mb-4">Gender Selection</p>
          <div className="space-y-3">
            <button onClick={() => { setFormData({ ...formData, gender: 'female' }); navigate(createPageUrl('Onboarding') + '?step=7.7'); }} className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4">
              <span>FEMALE</span>
              <ChevronIcon />
            </button>
            <button onClick={() => { setFormData({ ...formData, gender: 'male' }); navigate(createPageUrl('Onboarding') + '?step=7.7'); }} className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4">
              <span>MALE</span>
              <ChevronIcon />
            </button>
            <button onClick={() => navigate(createPageUrl('Onboarding') + '?step=7.5')} className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl hover:border-primary text-sm font-medium text-gray-800 flex items-center justify-between px-4">
              <span>OTHER</span>
              <ChevronIcon />
            </button>
            <button className="w-full h-12 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-400" disabled>
              PREFER NOT TO SAY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
