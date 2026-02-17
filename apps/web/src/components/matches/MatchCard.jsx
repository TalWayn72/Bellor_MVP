import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, likeService } from '@/api';
import { Heart, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function UserCard({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (isMounted && result.user) {
          setUser(result.user);
        }
      } catch {
        if (isMounted) {
          setUser({
            id: userId,
            profile_images: [`https://i.pravatar.cc/300?u=${userId}`]
          });
        }
      }
    };
    if (userId) fetchUser();
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <img
      src={user?.profile_images?.[0] || `https://i.pravatar.cc/300?u=${userId}`}
      alt="User"
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}

function UserInfo({ userId, type }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (isMounted && result.user) {
          setUser(result.user);
        }
      } catch {
        if (isMounted) setUser({ id: userId, nickname: 'User' });
      }
    };
    if (userId) fetchUser();
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <div>
      <h3 className="text-white font-semibold text-sm">{user?.nickname || 'User'}</h3>
      <p className="text-white/80 text-xs">
        {type === 'romantic' ? 'Showed romantic interest' : 'Gave positive feedback'}
      </p>
    </div>
  );
}

export default function MatchCard({ like, type }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRomantic = type === 'romantic';
  const IconComponent = isRomantic ? Heart : Sparkles;
  const colorClass = isRomantic ? 'love' : 'superlike';

  const handleReply = async (e) => {
    e.stopPropagation();
    if (like.user_id?.startsWith('demo-')) {
      toast({ title: 'Info', description: isRomantic ? 'Demo user - cannot send interest' : 'Demo user - cannot send feedback' });
      return;
    }
    try {
      await likeService.likeUser(like.user_id, isRomantic ? 'ROMANTIC' : 'POSITIVE');
      toast({ title: 'Success', description: isRomantic ? 'You sent romantic interest back!' : 'You sent positive feedback back!' });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Card variant="interactive" className="overflow-hidden">
      <div
        onClick={() => {
          const uid = like.user_id || like.userId;
          if (uid && uid !== 'undefined') navigate(createPageUrl(`UserProfile?id=${uid}`));
        }}
        className="w-full cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          const uid = like.user_id || like.userId;
          if (e.key === 'Enter' && uid && uid !== 'undefined') navigate(createPageUrl(`UserProfile?id=${uid}`));
        }}
      >
        <div className="relative aspect-[3/4]">
          <UserCard userId={like.user_id} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <div className={`w-10 h-10 rounded-full bg-${colorClass} flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <UserInfo userId={like.user_id} type={type} />
            <Button
              variant="glass"
              size="sm"
              onClick={handleReply}
              className={`text-${colorClass}`}
            >
              {isRomantic ? 'Reply \u2764\uFE0F' : 'Reply \u2B50'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
