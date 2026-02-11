import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import BackButton from '@/components/navigation/BackButton';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';
import { createPageUrl } from '@/utils';

export default function StepFirstQuestion({ formData, setFormData, handleNext, handleBack, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800" alt="Background" className="w-full h-full object-cover" style={{ filter: 'grayscale(100%)' }} />
      </div>

      <BackButton onClick={handleBack} className="top-6 right-6" />

      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-xl font-bold text-white drop-shadow-lg">Bell\u00f8r</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-8 text-white drop-shadow-lg">Your First Question</h2>

          <ProgressBar currentStep={11} totalSteps={TOTAL_STEPS} />

          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold mb-6 text-center text-gray-900">How do you usually express yourself?</h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button onClick={() => navigate(createPageUrl('VideoTask'))} className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button onClick={() => { setFormData({ ...formData, sketch_method: 'draw' }); navigate(createPageUrl('Onboarding') + '?step=13'); }} className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </button>
              <button onClick={() => navigate(createPageUrl('WriteTask'))} className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <button onClick={() => navigate(createPageUrl('AudioTask'))} className="aspect-square bg-muted rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-muted border-2 border-transparent hover:border-border transition-all">
                <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            <Button onClick={handleNext} disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
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
}
