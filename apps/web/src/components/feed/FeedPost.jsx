import React from 'react';
import { Heart, MessageCircle, Volume2, Flag, MessageSquare, Star } from 'lucide-react';
import { likeService, userService } from '@/api';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import HeartResponseSelector from './HeartResponseSelector';
import CommentsDialog from '../comments/CommentsDialog';
import CommentInputDialog from '../comments/CommentInputDialog';
import StarSendersModal from './StarSendersModal';
import { HashtagText, HashtagList } from './HashtagExtractor';
import { MentionText, MentionList } from './MentionExtractor';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function FeedPost({ response, currentUser, theme, onChatRequest, onHashtagClick }) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [userData, setUserData] = React.useState(null);
  const [isReporting, setIsReporting] = React.useState(false);
  const [isHeartSelectorOpen, setIsHeartSelectorOpen] = React.useState(false);
  const [heartSent, setHeartSent] = React.useState(false);
  const [chatRequestSent, setChatRequestSent] = React.useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [isCommentInputOpen, setIsCommentInputOpen] = React.useState(false);
  const [isStarSendersOpen, setIsStarSendersOpen] = React.useState(false);
  const [starSent, setStarSent] = React.useState(false);

  // Check if there are new comments (only for post owner)
  // Note: Comment service not implemented yet - returns false for now
  const { data: hasNewComments = false } = useQuery({
    queryKey: ['hasNewComments', response.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || currentUser.id !== response.user_id) return false;
      // Comment tracking service not implemented - return false for now
      return false;
    },
    enabled: !!currentUser && currentUser.id === response.user_id,
    refetchInterval: 30000,
  });

  // Check if current user already sent a star to this post
  React.useEffect(() => {
    const checkStarSent = async () => {
      if (!currentUser || !response.id) return;
      try {
        const result = await likeService.getResponseLikes(response.id, 'POSITIVE');
        const existingLikes = result.likes || [];
        const userSentStar = existingLikes.some(like => like.user_id === currentUser.id);
        setStarSent(userSentStar);
      } catch (error) {
        // Ignore
      }
    };
    checkStarSent();
  }, [currentUser, response.id, response.user_id]);

  // Check if there are new stars (only for post owner)
  // Note: StarReadReceipt service not implemented yet - just checks if stars exist
  const { data: hasNewStars = false } = useQuery({
    queryKey: ['hasNewStars', response.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || currentUser.id !== response.user_id) return false;

      try {
        // Get all stars for this post
        const result = await likeService.getResponseLikes(response.id, 'POSITIVE');
        const stars = result.likes || [];
        // For now, return true if there are any stars (read receipts not implemented)
        return stars.length > 0;
      } catch (error) {
        return false;
      }
    },
    enabled: !!currentUser && currentUser.id === response.user_id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch mentioned users
  const { data: mentionedUsers = [] } = useQuery({
    queryKey: ['mentionedUsers', response.mentioned_user_ids],
    queryFn: async () => {
      if (!response.mentioned_user_ids || response.mentioned_user_ids.length === 0) {
        return [];
      }
      const users = await Promise.all(
        response.mentioned_user_ids.map(async (userId) => {
          try {
            const user = await userService.getUserById(userId);
            return user;
          } catch (error) {
            return null;
          }
        })
      );
      return users.filter(u => u !== null);
    },
    enabled: !!response.mentioned_user_ids && response.mentioned_user_ids.length > 0,
  });

  React.useEffect(() => {
    // Fetch real user data for the response
    const fetchUser = async () => {
      // Skip fetching if no user_id
      if (!response.user_id) {
        setUserData({
          nickname: 'משתמש',
          age: 25,
          location: 'ישראל',
          is_verified: false,
          profile_images: ['https://i.pravatar.cc/150?u=unknown']
        });
        return;
      }

      // Skip fetching for demo users
      if (response.user_id.startsWith('demo')) {
        setUserData({
          nickname: 'משתמש',
          age: 25,
          location: 'ישראל',
          is_verified: false,
          profile_images: [`https://i.pravatar.cc/150?u=${response.user_id}`]
        });
        return;
      }

      try {
        const user = await userService.getUserById(response.user_id);
        if (user) {
          setUserData(user);
        } else {
          // Fallback for deleted users
          setUserData({
            nickname: 'משתמש',
            age: 25,
            location: 'ישראל',
            is_verified: false,
            profile_images: [`https://i.pravatar.cc/150?u=${response.user_id}`]
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserData({
          nickname: 'משתמש',
          age: 25,
          location: 'ישראל',
          is_verified: false,
          profile_images: [`https://i.pravatar.cc/150?u=${response.user_id}`]
        });
      }
    };
    fetchUser();
  }, [response.user_id]);

  if (!userData) return null;

  const handlePlayVoice = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement audio playback
  };

  return (
    <Card className="overflow-hidden">
      {/* User Info - Phase 1: Click to open profile */}
      <div className="p-3 flex items-center gap-3">
        <button
          onClick={() => navigate(createPageUrl(`UserProfile?id=${response.user_id}`))}
          className="flex items-center gap-3 flex-1"
        >
          <div className="relative">
            <Avatar size="default">
              <AvatarImage
                src={userData.profile_images?.[0] || `https://i.pravatar.cc/150?u=${response.user_id || 'default'}`}
                alt={userData.nickname || 'User'}
              />
              <AvatarFallback>{userData.nickname?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            {userData.is_verified && <AvatarBadge verified size="default" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm">{userData.nickname} • {userData.age}</h3>
              {userData.is_verified && (
                <Badge variant="verified" size="sm" className="h-4 px-1">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </Badge>
              )}
            </div>
          </div>
        </button>
        {response.response_type === 'voice' && (
          <button
            onClick={handlePlayVoice}
            className="p-1.5 rounded-lg bg-muted"
          >
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-info' : 'text-muted-foreground'}`} />
          </button>
        )}
      </div>

      {/* Text Content */}
      {response.text_content && (
        <div className="px-3 pb-3">
          {response.personal_prompt_prefix && (
            <p className="text-xs text-muted-foreground mb-1 italic">{response.personal_prompt_prefix}</p>
          )}
          <p className="text-sm text-foreground leading-relaxed">
            <MentionText
              text={response.text_content}
              mentionedUsers={mentionedUsers || []}
            />
          </p>
          {response.hashtags && response.hashtags.length > 0 && (
            <HashtagList
              hashtags={response.hashtags}
              onHashtagClick={onHashtagClick}
            />
          )}
          {mentionedUsers?.length > 0 && (
            <MentionList mentionedUsers={mentionedUsers} />
          )}
        </div>
      )}

      {/* Drawing/Image Content */}
      {response.response_type === 'drawing' && response.content && (
        <div className="px-3 pb-3">
          <div className="bg-muted rounded-xl p-3 border border-border">
            <img
              src={response.content}
              alt="Drawing"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Video Content */}
      {response.response_type === 'video' && response.content && (
        <div className="px-3 pb-3">
          <video
            src={response.content}
            controls
            className="w-full rounded-xl"
          />
        </div>
      )}

      {/* Action Bar - Interaction Icons Order: Heart, Comment, Star, Chat */}
      <div className="px-3 pb-3 flex items-center justify-around border-t pt-3">
        {/* 1. Heart - Romantic Interest */}
        <button
          className="flex flex-col items-center gap-1 disabled:opacity-50"
          onClick={() => setIsHeartSelectorOpen(true)}
          disabled={heartSent}
        >
          <Heart className={`w-6 h-6 ${heartSent ? 'fill-love text-love' : 'text-love'}`} />
          <span className={`text-xs ${heartSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
            {heartSent ? '✓ נשלח' : 'עניין רומנטי'}
          </span>
        </button>

        {/* 2. Comment */}
        <button
          className="flex flex-col items-center gap-1 relative"
          onClick={() => {
            if (currentUser?.id === response.user_id) {
              setIsCommentsOpen(true);
            } else {
              setIsCommentInputOpen(true);
            }
          }}
        >
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
          {hasNewComments && currentUser?.id === response.user_id && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-love rounded-full animate-pulse" />
          )}
          <span className="text-xs text-muted-foreground">
            {currentUser?.id === response.user_id ? 'תגובות' : 'כתוב תגובה'}
          </span>
        </button>

        {/* 3. Star - Positive Feedback */}
        <button
          className="flex flex-col items-center gap-1 relative disabled:opacity-50"
          disabled={starSent && currentUser?.id !== response.user_id}
          onClick={async () => {
            if (currentUser?.id === response.user_id) {
              setIsStarSendersOpen(true);
              return;
            }

            if (starSent) return;

            try {
              await likeService.likeUser(response.user_id, 'POSITIVE', response.id);
              setStarSent(true);
            } catch (error) {
              console.error('Error:', error);
            }
          }}
        >
          <Star className={`w-6 h-6 ${starSent ? 'fill-superlike text-superlike' : 'text-superlike'}`} />
          {hasNewStars && currentUser?.id === response.user_id && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-love rounded-full animate-pulse" />
          )}
          <span className={`text-xs ${starSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
            {currentUser?.id === response.user_id
              ? 'כוכבים'
              : starSent
                ? '✓ נשלח'
                : 'פידבק חיובי'}
          </span>
        </button>

        {/* 4. Temporary Chat Request */}
        <button
          onClick={() => {
            if (!chatRequestSent && onChatRequest) {
              onChatRequest({ ...userData, id: response.user_id });
              setChatRequestSent(true);
            }
          }}
          disabled={chatRequestSent}
          className="flex flex-col items-center gap-1 disabled:opacity-50"
        >
          <MessageCircle className={`w-6 h-6 ${chatRequestSent ? 'fill-info text-info' : 'text-info'}`} />
          <span className={`text-xs ${chatRequestSent ? 'text-success font-medium' : 'text-muted-foreground'}`}>
            {chatRequestSent ? "✓ בקשה נשלחה" : "בקשת צ'אט"}
          </span>
        </button>
      </div>

      <HeartResponseSelector
        isOpen={isHeartSelectorOpen}
        onClose={(sent) => {
          setIsHeartSelectorOpen(false);
          if (sent) setHeartSent(true);
        }}
        targetUser={userData}
        currentUser={currentUser}
        responseId={response.id}
      />

      <CommentsDialog
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        response={response}
        currentUser={currentUser}
      />

      <CommentInputDialog
        isOpen={isCommentInputOpen}
        onClose={() => setIsCommentInputOpen(false)}
        response={response}
        currentUser={currentUser}
      />

      <StarSendersModal
        isOpen={isStarSendersOpen}
        onClose={() => setIsStarSendersOpen(false)}
        response={response}
        currentUser={currentUser}
      />
    </Card>
  );
}