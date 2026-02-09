import React from 'react';
import BackButton from '@/components/navigation/BackButton';

export default function LiveChatHeader() {
  return (
    <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
        <BackButton variant="header" position="relative" fallback="/HelpSupport" />
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">Live Support</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <div className="min-w-[24px]"></div>
      </div>
    </header>
  );
}
