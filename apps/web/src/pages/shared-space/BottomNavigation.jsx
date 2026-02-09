import React from 'react';
import { Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function BottomNavigation({ currentUser, onNavigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-around">
        <button onClick={() => onNavigate(createPageUrl('SharedSpace'))} className="flex flex-col items-center gap-1 text-primary">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span className="text-xs">{'\u05e4\u05d9\u05d3'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('TemporaryChats'))} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-xs">{'\u05e6\u05f3\u05d0\u05d8\u05d9\u05dd'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('Matches'))} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-love transition-colors">
          <Heart className="w-7 h-7" /><span className="text-xs">{'\u05e2\u05e0\u05d9\u05d9\u05df'}</span>
        </button>
        <button onClick={() => onNavigate(createPageUrl('Profile'))} className="flex flex-col items-center gap-1">
          <Avatar size="sm" className="border-2 border-border">
            <AvatarImage src={currentUser.main_profile_image_url || currentUser.profile_images?.[0] || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Profile" />
            <AvatarFallback>{currentUser.nickname?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{'\u05e4\u05e8\u05d5\u05e4\u05d9\u05dc'}</span>
        </button>
      </div>
    </nav>
  );
}
