import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Inbox, MessageSquare, Heart, Users, Search, FileText, Bell,
  Image, Calendar, Star, Award, Settings, HelpCircle, ShoppingBag,
  Bookmark, Music, Video, Mic,
} from 'lucide-react';

// Icon mapping by variant
const variantIcons = {
  default: Inbox, messages: MessageSquare, matches: Heart,
  feed: FileText, notifications: Bell, search: Search,
  followers: Users, following: Users, media: Image,
  photos: Image, videos: Video, audio: Mic,
  events: Calendar, achievements: Award, settings: Settings,
  help: HelpCircle, premium: Star, bookmarks: Bookmark,
  cart: ShoppingBag, music: Music,
};

// Default content by variant
const variantDefaults = {
  default: { title: 'No content yet', description: 'There is nothing to display at the moment.' },
  messages: { title: 'No messages yet', description: 'Start a conversation and your messages will appear here.' },
  matches: { title: 'No matches yet', description: 'Keep exploring and connecting to find your matches!' },
  feed: { title: 'No posts yet', description: 'Be the first to share something amazing.' },
  notifications: { title: 'No notifications', description: "You're all caught up! Check back later for updates." },
  search: { title: 'No results found', description: 'Try adjusting your search or filters.' },
  followers: { title: 'No followers yet', description: 'Share your profile to get followers.' },
  following: { title: 'Not following anyone', description: 'Discover interesting people to follow.' },
  media: { title: 'No media yet', description: 'Upload photos or videos to get started.' },
  photos: { title: 'No photos yet', description: 'Add some photos to your profile.' },
  videos: { title: 'No videos yet', description: 'Create your first video response.' },
  audio: { title: 'No audio yet', description: 'Record your first voice response.' },
  events: { title: 'No events yet', description: 'Check back later for upcoming events.' },
  achievements: { title: 'No achievements yet', description: 'Complete tasks to earn badges and rewards!' },
  premium: { title: 'Unlock premium features', description: 'Upgrade to access exclusive benefits.' },
  bookmarks: { title: 'No bookmarks yet', description: 'Save content you want to revisit later.' },
};

// Color variations by variant
const iconColorClasses = {
  matches: 'text-love bg-love/10',
  premium: 'text-warning bg-warning/10',
  achievements: 'text-success bg-success/10',
  notifications: 'text-info bg-info/10',
  default: 'text-muted-foreground bg-muted',
};

export function EmptyState({
  variant = 'default', title, description,
  actionLabel, onAction, secondaryActionLabel, onSecondaryAction,
  icon: CustomIcon, className,
}) {
  const Icon = CustomIcon || variantIcons[variant] || Inbox;
  const defaults = variantDefaults[variant] || variantDefaults.default;
  const displayTitle = title || defaults.title;
  const displayDescription = description || defaults.description;
  const iconColor = iconColorClasses[variant] || iconColorClasses.default;

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className={cn('rounded-full p-6 mb-6', iconColor)}>
        <Icon className="h-12 w-12" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{displayDescription}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default">{actionLabel}</Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline">{secondaryActionLabel}</Button>
        )}
      </div>
    </div>
  );
}

// Re-export variant shortcuts for backward compatibility
export {
  NoMessages, NoMatches, NoNotifications, NoSearchResults,
  NoFeedPosts, NoFollowers, NoAchievements,
} from './EmptyStateVariants';

export default EmptyState;
