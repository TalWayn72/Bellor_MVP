import React from 'react';
import { Button } from '@/components/ui/button';

export default function StepWelcome({ handleNext }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-400 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="w-48 h-48 mx-auto flex items-center justify-center mb-6">
            <img
              src="/bellor-logo.png"
              alt="Bell\u00f8r"
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
          <h2 className="text-3xl font-bold text-center mb-3 text-white">Welcome to Bell\u00f8r</h2>
          <p className="text-center text-base text-white/90 mb-8">
            A place for people<br />to tell the truth in the light
          </p>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-white/30">
            <h3 className="font-bold text-sm mb-2 text-center text-white">No Swipe</h3>
            <p className="text-xs text-white/90 leading-relaxed text-center">
              At Bell\u00f8r, there's no superficial swiping. We believe in authentic connections through daily shared moments and creative self-expression.
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
}
