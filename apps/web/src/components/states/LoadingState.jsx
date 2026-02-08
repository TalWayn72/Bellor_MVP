import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import {
  CardsSkeleton_Variant,
  ListSkeleton_Variant,
  ProfileSkeleton_Variant,
  ChatSkeleton_Variant,
  FeedSkeleton_Variant,
} from './SkeletonVariants';

/**
 * LoadingState - Reusable loading component with multiple variants
 *
 * @param {string} variant - 'spinner' | 'skeleton' | 'cards' | 'list' | 'profile' | 'chat' | 'full'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {number} count - Number of skeleton items to show (for cards/list variants)
 * @param {string} text - Optional loading text
 * @param {string} className - Additional CSS classes
 */
export function LoadingState({ variant = 'spinner', size = 'md', count = 3, text, className }) {
  const sizeClasses = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-16 w-16' };

  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-4', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('min-h-screen bg-background flex flex-col items-center justify-center gap-4', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses.lg)} />
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === 'cards') return <CardsSkeleton_Variant count={count} className={className} />;
  if (variant === 'list') return <ListSkeleton_Variant count={count} className={className} />;
  if (variant === 'profile') return <ProfileSkeleton_Variant className={className} />;
  if (variant === 'chat') return <ChatSkeleton_Variant count={count} className={className} />;
  if (variant === 'feed') return <FeedSkeleton_Variant count={count} className={className} />;

  // Default skeleton
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

// Shorthand exports for common use cases
export function PageLoading({ text = 'Loading...' }) {
  return <LoadingState variant="full" text={text} />;
}

export function CardsSkeleton({ count = 6 }) {
  return <LoadingState variant="cards" count={count} />;
}

export function ListSkeleton({ count = 5 }) {
  return <LoadingState variant="list" count={count} />;
}

export function ProfileSkeleton() {
  return <LoadingState variant="profile" />;
}

export function ChatSkeleton({ count = 5 }) {
  return <LoadingState variant="chat" count={count} />;
}

export function FeedSkeleton({ count = 3 }) {
  return <LoadingState variant="feed" count={count} />;
}

export default LoadingState;
