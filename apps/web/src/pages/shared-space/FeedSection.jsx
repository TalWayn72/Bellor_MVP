import React from 'react';
import FeedPost from '@/components/feed/FeedPost';
import { EmptyState } from '@/components/states';

export default function FeedSection({ responses, currentUser, theme, onChatRequest, onHashtagClick, onOpenTaskSelector }) {
  return (
    <div className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-240px)]" style={{ scrollBehavior: 'smooth' }}>
      {responses.length === 0 ? (
        <div className="h-[calc(100vh-240px)] flex items-center justify-center px-4">
          <EmptyState variant="feed" title="No posts yet" description="Be the first to share something! Complete the daily task above." actionLabel="Share now" onAction={onOpenTaskSelector} />
        </div>
      ) : (
        responses.map((response) => (
          <div key={response.id} className="snap-start h-[calc(100vh-240px)] flex items-center px-4" style={{ paddingBottom: '11pt' }}>
            <FeedPost response={response} currentUser={currentUser} theme={theme} onChatRequest={onChatRequest} onHashtagClick={onHashtagClick} />
          </div>
        ))
      )}
    </div>
  );
}
