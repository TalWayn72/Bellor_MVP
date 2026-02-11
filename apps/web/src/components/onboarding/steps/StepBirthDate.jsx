import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';

export default function StepBirthDate({ formData, setFormData, handleNext }) {
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear - 120}-01-01`;
  const maxDate = (() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  })();

  return (
    <div className="flex-1 flex flex-col bg-white">
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

          <label className="block text-sm text-gray-500 mb-2">Date of birth</label>
          <Input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            min={minDate}
            max={maxDate}
            className="w-full h-12 text-base"
          />
          <p className="text-xs text-gray-500 mt-1">You must be at least 18 years old</p>
        </div>
      </div>

      <div className="p-6 border-t" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <Button
          onClick={handleNext}
          disabled={!formData.date_of_birth || (() => {
            const year = parseInt(formData.date_of_birth.split('-')[0]);
            return year < (currentYear - 120) || year > (currentYear - 18);
          })()}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NEXT
          <ArrowRight className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  );
}
