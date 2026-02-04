import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TutorialOverlay({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Bellor! 🌟",
      description: "Let's take a quick tour to show you how to connect authentically.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"
    },
    {
      title: "Daily Tasks 📝",
      description: "Share your thoughts, stories, and creativity through daily prompts. This is how others get to know the real you.",
      highlight: "daily-task",
      image: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=400"
    },
    {
      title: "The Feed 📱",
      description: "Discover authentic shares from others. Swipe down to see more posts, one at a time - no endless scrolling.",
      highlight: "feed",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400"
    },
    {
      title: "Show Interest ❤️",
      description: "When someone's post resonates with you, tap the heart to show romantic interest, or the star for positive feedback.",
      highlight: "interest-icons",
      image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400"
    },
    {
      title: "Active Chats 💬",
      description: "Your ongoing conversations appear as circles at the top. Tap to jump right into chatting.",
      highlight: "chat-circles",
      image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400"
    },
    {
      title: "You're All Set! ✨",
      description: "Start by sharing your first daily task. The more authentic you are, the better your connections will be!",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400"
    }
  ];

  const currentStep = tutorialSteps[step];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" dir="ltr">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          <img
            src={currentStep.image}
            alt={currentStep.title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 text-center">{currentStep.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed text-center mb-6">
            {currentStep.description}
          </p>

          {/* Progress Dots */}
          <div className="flex gap-2 justify-center mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === step ? 'w-8 bg-gray-900' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 h-12 border-2 border-gray-300"
              >
                Back
              </Button>
            )}
            {step < tutorialSteps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={onClose}
                className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white"
              >
                Start Exploring
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}