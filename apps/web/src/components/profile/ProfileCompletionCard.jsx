import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Circle } from 'lucide-react';

export default function ProfileCompletionCard({ user }) {
  const navigate = useNavigate();

  const steps = [
    { id: 'photos', label: 'Add photos', completed: user?.profile_images?.length > 0, path: 'EditProfile' },
    { id: 'bio', label: 'Write bio', completed: user?.bio?.length > 10, path: 'EditProfile' },
    { id: 'interests', label: 'Add interests', completed: user?.interests?.length > 0, path: 'EditProfile' },
    { id: 'verification', label: 'Verify profile', completed: user?.is_verified, path: 'UserVerification' },
    { id: 'quiz', label: 'Complete compatibility quiz', completed: false, path: 'CompatibilityQuiz' }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  if (percentage === 100) return null;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">Complete Your Profile</h3>
          <p className="text-xs text-gray-500">{percentage}% complete</p>
        </div>
        <div className="text-2xl font-bold text-purple-600">{completedCount}/{steps.length}</div>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.filter(s => !s.completed).slice(0, 3).map((step) => (
          <button
            key={step.id}
            onClick={() => navigate(createPageUrl(step.path))}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Circle className="w-5 h-5 text-gray-500" />
              <span className="text-sm">{step.label}</span>
            </div>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}