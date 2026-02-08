/**
 * PrivateChat Constants and Shared Components
 * Extracted from PrivateChat.jsx to keep under 150-line limit
 */

import React from 'react';
import { Button } from '@/components/ui/button';

export const ICE_BREAKERS = [
  { text: "What's your favorite way to spend a weekend?", category: "casual" },
  { text: "If you could have dinner with anyone, who would it be?", category: "fun" },
  { text: "What's something you're passionate about?", category: "deep" },
  { text: "What's your most memorable travel experience?", category: "casual" },
  { text: "Do you prefer coffee or tea?", category: "casual" },
];

export function ErrorScreen({ title, description, onBack }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button onClick={onBack}>Back to Feed</Button>
      </div>
    </div>
  );
}
