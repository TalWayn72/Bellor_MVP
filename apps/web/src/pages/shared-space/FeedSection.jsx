import React from 'react';
import FeedPost from '@/components/feed/FeedPost';
import { EmptyState } from '@/components/states';

export default function FeedSection({ responses, currentUser, theme, onChatRequest, onHashtagClick, onOpenTaskSelector }) {
  return (
    <div className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-160px)]" style={{ scrollBehavior: 'smooth' }}>
      {responses.length === 0 ? (
        <div className="h-[calc(100vh-160px)] flex items-center justify-center px-4">
          <EmptyState variant="feed" title="No posts yet" description="Be the first to share something! Complete the daily task above." actionLabel="Share now" onAction={onOpenTaskSelector} />
        </div>
      ) : (
        responses.map((response) => (
          <div key={response.id} className="snap-start min-h-[calc(100vh-160px)] flex items-start px-4 pt-2 pb-3">
            <FeedPost response={response} currentUser={currentUser} theme={theme} onChatRequest={onChatRequest} onHashtagClick={onHashtagClick} />
          </div>
        ))
      )}
    </div>
  );
}
