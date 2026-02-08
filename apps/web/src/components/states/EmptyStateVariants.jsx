import React from 'react';
import { EmptyState } from './EmptyState';

// Shorthand exports for common use cases
export function NoMessages({ onAction, actionLabel = 'Start chatting' }) {
  return <EmptyState variant="messages" onAction={onAction} actionLabel={actionLabel} />;
}

export function NoMatches({ onAction, actionLabel = 'Discover people' }) {
  return <EmptyState variant="matches" onAction={onAction} actionLabel={actionLabel} />;
}

export function NoNotifications() {
  return <EmptyState variant="notifications" />;
}

export function NoSearchResults({ query }) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={query ? `No results for "${query}". Try different keywords.` : 'Try adjusting your search or filters.'}
    />
  );
}

export function NoFeedPosts({ onAction, actionLabel = 'Create post' }) {
  return <EmptyState variant="feed" onAction={onAction} actionLabel={actionLabel} />;
}

export function NoFollowers() {
  return <EmptyState variant="followers" />;
}

export function NoAchievements({ onAction, actionLabel = 'View tasks' }) {
  return <EmptyState variant="achievements" onAction={onAction} actionLabel={actionLabel} />;
}
