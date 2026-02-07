import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';

export default function StepNickname({ formData, setFormData, handleNext }) {
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
}
