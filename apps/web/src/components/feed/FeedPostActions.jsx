import React from 'react';
import { Heart, MessageCircle, MessageSquare, Star } from 'lucide-react';
import { likeService } from '@/api';

export default function FeedPostActions({
  response,
  currentUser,
  userData,
  heartSent,
  starSent,
  setStarSent,
  chatRequestSent,
  setChatRequestSent,
  hasNewComments,
  hasNewStars,
  onOpenHeartSelector,
  onOpenComments,
  onOpenCommentInput,
  onOpenStarSenders,
  onChatRequest,
}) {
  const handleStarClick = async () => {
    if (currentUser?.id === response.user_id) {
      onOpenStarSenders();
      return;
    }

    if (starSent) return;

    try {
      await likeService.likeUser(response.user_id, 'POSITIVE', response.id);
      setStarSent(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleChatRequest = () => {
    if (!chatRequestSent && onChatRequest && response.user_id) {
      onChatRequest({ ...userData, id: response.user_id });
      setChatRequestSent(true);
    }
  };

  const handleCommentClick = () => {
    if (currentUser?.id === response.user_id) {
      onOpenComments();
    } else {
      onOpenCommentInput();
    }
  };

  return (
    <div className="px-3 pb-3 flex items-center justify-around border-t pt-3">
      {/* 1. Heart - Romantic Interest (hidden on own posts) */}
      {currentUser?.id !== response.user_id && (
        <button
          className="flex flex-col items-center gap-1 disabled:opacity-50"
          onClick={onOpenHeartSelector}
          disabled={heartSent}
        >
          <Heart className={`w-6 h-6 ${heartSent ? 'fill-love text-love' : 'text-love'}`} />
          <span className={`text-xs ${heartSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
            {heartSent ? '\u2713 \u05E0\u05E9\u05DC\u05D7' : '\u05E2\u05E0\u05D9\u05D9\u05DF \u05E8\u05D5\u05DE\u05E0\u05D8\u05D9'}
          </span>
        </button>
      )}

      {/* 2. Comment */}
      <button className="flex flex-col items-center gap-1 relative" onClick={handleCommentClick}>
        <MessageSquare className="w-6 h-6 text-muted-foreground" />
        {hasNewComments && currentUser?.id === response.user_id && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-love rounded-full animate-pulse" />
        )}
        <span className="text-xs text-muted-foreground">
          {currentUser?.id === response.user_id ? '\u05EA\u05D2\u05D5\u05D1\u05D5\u05EA' : '\u05DB\u05EA\u05D5\u05D1 \u05EA\u05D2\u05D5\u05D1\u05D4'}
        </span>
      </button>

      {/* 3. Star - Positive Feedback */}
      <button
        className="flex flex-col items-center gap-1 relative disabled:opacity-50"
        disabled={starSent && currentUser?.id !== response.user_id}
        onClick={handleStarClick}
      >
        <Star className={`w-6 h-6 ${starSent ? 'fill-superlike text-superlike' : 'text-superlike'}`} />
        {hasNewStars && currentUser?.id === response.user_id && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-love rounded-full animate-pulse" />
        )}
        <span className={`text-xs ${starSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
          {currentUser?.id === response.user_id
            ? '\u05DB\u05D5\u05DB\u05D1\u05D9\u05DD'
            : starSent
              ? '\u2713 \u05E0\u05E9\u05DC\u05D7'
              : '\u05E4\u05D9\u05D3\u05D1\u05E7 \u05D7\u05D9\u05D5\u05D1\u05D9'}
        </span>
      </button>

      {/* 4. Temporary Chat Request */}
      <button
        onClick={handleChatRequest}
        disabled={chatRequestSent}
        className="flex flex-col items-center gap-1 disabled:opacity-50"
      >
        <MessageCircle className={`w-6 h-6 ${chatRequestSent ? 'fill-info text-info' : 'text-info'}`} />
        <span className={`text-xs ${chatRequestSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
          {chatRequestSent ? "\u2713 \u05D1\u05E7\u05E9\u05D4 \u05E0\u05E9\u05DC\u05D7\u05D4" : "\u05D1\u05E7\u05E9\u05EA \u05E6'\u05D0\u05D8"}
        </span>
      </button>
    </div>
  );
}
