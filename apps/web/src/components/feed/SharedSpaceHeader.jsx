import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import NotificationBadge from '@/components/notifications/NotificationBadge';

export default function SharedSpaceHeader({
  currentUser,
  onOpenDrawer,
  onNavigate,
}) {
  return (
    <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
        <div className="min-w-[24px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenDrawer}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">Shared Space</h1>
        </div>

        <div className="min-w-[24px]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(createPageUrl('Notifications'))}
            aria-label="View notifications"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <NotificationBadge userId={currentUser?.id} />
          </Button>
        </div>
      </div>
    </header>
  );
}
