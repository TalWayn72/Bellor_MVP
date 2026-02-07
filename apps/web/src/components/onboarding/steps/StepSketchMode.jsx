import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import ProgressBar from '@/components/onboarding/ProgressBar';
import BackButton from '@/components/navigation/BackButton';
import { TOTAL_STEPS } from '@/components/onboarding/utils/onboardingUtils';

export default function StepSketchMode({ formData, setFormData, handleNext, handleBack }) {
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
        <h1 className="text-xl font-bold">Bell\u00f8r</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-center mb-6">Choose your Sketch Mode</h2>

          <ProgressBar currentStep={9} totalSteps={TOTAL_STEPS} />

          <div className="bg-white rounded-3xl p-5 shadow-lg">
            <h3 className="text-base font-bold mb-3">Draw Your Choice</h3>
            <p className="text-xs text-muted-foreground mb-4">Express your choice in a simple sketch</p>

            <button
              onClick={() => { setFormData({ ...formData, sketch_method: 'self' }); handleNext(); }}
              className="w-full bg-muted rounded-xl p-3 mb-3 border-2 border-transparent hover:border-primary cursor-pointer transition-all text-left"
            >
              <h4 className="font-semibold text-xs mb-1">Self-Expression</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Draw something that reflect your vibe, personality, lifestyle, or anything that symbolizes you
              </p>
            </button>

            <button
              onClick={() => { setFormData({ ...formData, sketch_method: 'guess' }); handleNext(); }}
              className="w-full bg-muted rounded-xl p-3 mb-4 border-2 border-transparent hover:border-primary cursor-pointer transition-all text-left"
            >
              <h4 className="font-semibold text-xs mb-1">Let Others Guess</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your sketch becomes a mystery! Others will try to guess what you drew
              </p>
            </button>

            <Button
              onClick={() => { setFormData({ ...formData, sketch_method: 'draw' }); handleNext(); }}
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
}
