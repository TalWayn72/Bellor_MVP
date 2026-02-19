import React from 'react';
import { Heart, MessageCircle, Compass, User } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BottomNavigation({ onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-around">
        <button onClick={() => onNavigate(createPageUrl('SharedSpace'))} className="flex flex-col items-center gap-0.5 py-1 min-w-[56px]">
          <Compass className="w-6 h-6 text-primary fill-primary/20" strokeWidth={2.2} />
          <span className="text-[10px] font-medium text-primary">{'\u05e4\u05d9\u05d3'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('TemporaryChats'))} className="flex flex-col items-center gap-0.5 py-1 min-w-[56px] group">
          <MessageCircle className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={2} />
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{'\u05e6\u05f3\u05d0\u05d8\u05d9\u05dd'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('Matches'))} className="flex flex-col items-center gap-0.5 py-1 min-w-[56px] group">
          <Heart className="w-6 h-6 text-muted-foreground group-hover:text-love transition-colors" strokeWidth={2} />
          <span className="text-[10px] text-muted-foreground group-hover:text-love transition-colors">{'\u05e2\u05e0\u05d9\u05d9\u05df'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('Profile'))} className="flex flex-col items-center gap-0.5 py-1 min-w-[56px] group">
          <User className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={2} />
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{'\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc'}</span>
        </button>
      </div>
    </nav>
  );
}
