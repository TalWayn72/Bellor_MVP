import React from 'react';
import { likeService, userService } from '@/api';
import { transformUser } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import HeartResponseSelector from './HeartResponseSelector';
import CommentsDialog from '../comments/CommentsDialog';
import CommentInputDialog from '../comments/CommentInputDialog';
import StarSendersModal from './StarSendersModal';
import { HashtagList } from './HashtagExtractor';
import { MentionText, MentionList } from './MentionExtractor';
import { Card } from '@/components/ui/card';
import FeedPostHeader from './FeedPostHeader';
import FeedPostActions from './FeedPostActions';

export default function FeedPost({ response, currentUser, theme, onChatRequest, onHashtagClick }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [userData, setUserData] = React.useState(null);
  const [isHeartSelectorOpen, setIsHeartSelectorOpen] = React.useState(false);
  const [heartSent, setHeartSent] = React.useState(false);
  const [chatRequestSent, setChatRequestSent] = React.useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [isCommentInputOpen, setIsCommentInputOpen] = React.useState(false);
  const [isStarSendersOpen, setIsStarSendersOpen] = React.useState(false);
  const [starSent, setStarSent] = React.useState(false);
  const audioRef = React.useRef(null);

  const { data: hasNewComments = false } = useQuery({
    queryKey: ['hasNewComments', response.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || currentUser.id !== response.user_id) return false;
      return false;
    },
    enabled: !!currentUser && currentUser.id === response.user_id,
    refetchInterval: 30000,
  });

  React.useEffect(() => {
    let isMounted = true;
    const checkStarSent = async () => {
      if (!currentUser || !response.id) return;
      try {
        const result = await likeService.getResponseLikes(response.id, 'POSITIVE');
        const existingLikes = result.likes || [];
        if (isMounted) setStarSent(existingLikes.some(like => like.user_id === currentUser.id));
      } catch (error) { /* Ignore */ }
    };
    checkStarSent();
    return () => { isMounted = false; };
  }, [currentUser, response.id]);

  const { data: hasNewStars = false } = useQuery({
    queryKey: ['hasNewStars', response.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || currentUser.id !== response.user_id) return false;
      try {
        const result = await likeService.getResponseLikes(response.id, 'POSITIVE');
        return (result.likes || []).length > 0;
      } catch (error) { return false; }
    },
    enabled: !!currentUser && currentUser.id === response.user_id,
    refetchInterval: 30000,
  });

  const { data: mentionedUsers = [] } = useQuery({
    queryKey: ['mentionedUsers', response.mentioned_user_ids],
    queryFn: async () => {
      if (!response.mentioned_user_ids?.length) return [];
      const users = await Promise.all(
        response.mentioned_user_ids.map(async (userId) => {
          try { const r = await userService.getUserById(userId); return r?.user || r; } catch { return null; }
        })
      );
      return users.filter(u => u !== null);
    },
    enabled: !!response.mentioned_user_ids && response.mentioned_user_ids.length > 0,
  });

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      const fallback = { id: response.user_id, nickname: '\u05DE\u05E9\u05EA\u05DE\u05E9', age: 25, location: '\u05D9\u05E9\u05E8\u05D0\u05DC', is_verified: false, profile_images: [`https://i.pravatar.cc/150?u=${response.user_id || 'unknown'}`] };
      if (!response.user_id || response.user_id.startsWith('demo')) { if (isMounted) setUserData(fallback); return; }
      try {
        const result = await userService.getUserById(response.user_id);
        const user = result?.user || result;
        if (isMounted) setUserData(user ? transformUser(user) : fallback);
      } catch { if (isMounted) setUserData(fallback); }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [response.user_id]);

  // Cleanup audio on unmount - must be before early return to respect Rules of Hooks
  React.useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

  if (!userData) return null;

  const handlePlayVoice = () => {
    if (!audioRef.current) { audioRef.current = new Audio(response.content); audioRef.current.onended = () => setIsPlaying(false); audioRef.current.onerror = () => setIsPlaying(false); }
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play().catch(() => setIsPlaying(false)); }
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="overflow-hidden">
      <FeedPostHeader userData={userData} response={response} isPlaying={isPlaying} onPlayVoice={handlePlayVoice} />

      {response.text_content && (
        <div className="px-3 pb-3">
          {response.personal_prompt_prefix && (<p className="text-xs text-muted-foreground mb-1 italic">{response.personal_prompt_prefix}</p>)}
          <p className="text-sm text-foreground leading-relaxed"><MentionText text={response.text_content} mentionedUsers={mentionedUsers || []} /></p>
          {response.hashtags?.length > 0 && <HashtagList hashtags={response.hashtags} onHashtagClick={onHashtagClick} />}
          {mentionedUsers?.length > 0 && <MentionList mentionedUsers={mentionedUsers} />}
        </div>
      )}

      {response.response_type === 'drawing' && response.content && (
        <div className="px-3 pb-3"><div className="bg-muted rounded-xl p-3 border border-border"><img src={response.content} alt="Drawing" className="w-full h-auto rounded-lg" loading="lazy" /></div></div>
      )}
      {response.response_type === 'video' && response.content && (
        <div className="px-3 pb-3"><video src={response.content} controls className="w-full rounded-xl" /></div>
      )}

      <FeedPostActions response={response} currentUser={currentUser} userData={userData} heartSent={heartSent} setHeartSent={setHeartSent} starSent={starSent} setStarSent={setStarSent} chatRequestSent={chatRequestSent} setChatRequestSent={setChatRequestSent} hasNewComments={hasNewComments} hasNewStars={hasNewStars} onOpenHeartSelector={() => setIsHeartSelectorOpen(true)} onOpenComments={() => setIsCommentsOpen(true)} onOpenCommentInput={() => setIsCommentInputOpen(true)} onOpenStarSenders={() => setIsStarSendersOpen(true)} onChatRequest={onChatRequest} />

      <HeartResponseSelector isOpen={isHeartSelectorOpen} onClose={(sent) => { setIsHeartSelectorOpen(false); if (sent) setHeartSent(true); }} targetUser={userData} currentUser={currentUser} responseId={response.id} />
      <CommentsDialog isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} response={response} currentUser={currentUser} />
      <CommentInputDialog isOpen={isCommentInputOpen} onClose={() => setIsCommentInputOpen(false)} response={response} currentUser={currentUser} />
      <StarSendersModal isOpen={isStarSendersOpen} onClose={() => setIsStarSendersOpen(false)} response={response} currentUser={currentUser} />
    </Card>
  );
}
