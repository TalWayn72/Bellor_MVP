import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate(createPageUrl('Onboarding') + '?step=2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <img
          src="/bellor-logo.png"
          alt="Bellør"
          className="w-48 h-auto mx-auto mb-8 drop-shadow-2xl"
        />
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Bellør</h1>
        <p className="text-xl text-white/90 mb-12">A place for authentic connections</p>

        <div className="space-y-4">
          <Button
            onClick={handleNext}
            className="w-full h-14 bg-white text-gray-800 border-2 border-gray-200 hover:bg-gray-50 text-lg font-semibold rounded-2xl shadow-xl transition-all"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-white/70 mt-6">
            Join thousands finding meaningful connections
          </p>
        </div>
      </div>
    </div>
  );
}