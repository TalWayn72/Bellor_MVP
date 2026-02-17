import React from 'react';

export default function ProgressBar({ currentStep, totalSteps }) {
  const segments = 10;
  const filledSegments = Math.round((currentStep / totalSteps) * segments);

  return (
    <div className="mb-8">
      <p className="text-xs text-gray-600 mb-2 text-left">{currentStep} of {totalSteps} steps completed</p>
      <div className="flex gap-2">
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < filledSegments ? 'bg-green-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}