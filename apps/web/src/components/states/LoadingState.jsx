import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

/**
 * LoadingState - Reusable loading component with multiple variants
 *
 * @param {string} variant - 'spinner' | 'skeleton' | 'cards' | 'list' | 'profile' | 'chat' | 'full'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {number} count - Number of skeleton items to show (for cards/list variants)
 * @param {string} text - Optional loading text
 * @param {string} className - Additional CSS classes
 */
export function LoadingState({
  variant = 'spinner',
  size = 'md',
  count = 3,
  text,
  className
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  // Spinner variant - simple centered spinner
  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 gap-4', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
      </div>
    );
  }

  // Full page loading
  if (variant === 'full') {
    return (
      <div className={cn('min-h-screen bg-background flex flex-col items-center justify-center gap-4', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses.lg)} />
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
    );
  }

  // Cards skeleton - for grid layouts
  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List skeleton - for list layouts
  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Profile skeleton - for profile pages
  if (variant === 'profile') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        {/* Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {/* Content grid */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Chat skeleton - for chat/messages
  if (variant === 'chat') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn('flex gap-3', i % 2 === 0 ? '' : 'flex-row-reverse')}>
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className={cn('space-y-1', i % 2 === 0 ? 'items-start' : 'items-end')}>
              <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-48 rounded-tl-sm' : 'w-56 rounded-tr-sm')} />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Feed skeleton - for feed posts
  if (variant === 'feed') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            {/* Content */}
            <Skeleton className="h-64 w-full" />
            {/* Actions */}
            <div className="flex items-center gap-4 p-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
