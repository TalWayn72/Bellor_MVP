import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import FollowButton from '@/components/profile/FollowButton';

export default function FollowingCard({ userId, currentUserId }) {
  const navigate = useNavigate();
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const fallback = {
      id: userId, nickname: 'User', age: 25,
      location: 'Israel', bio: '',
      profile_images: [`https://i.pravatar.cc/150?u=${userId}`]
    };
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (!isMounted) return;
        setUserData(result.user || fallback);
      } catch (error) {
        if (isMounted) setUserData(fallback);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [userId]);

  if (!userData) return null;

  return (
    <Card variant="interactive">
      <CardContent className="p-4 flex items-center gap-3">
        <button
          onClick={() => userId && userId !== 'undefined' && navigate(createPageUrl(`UserProfile?id=${userId}`))}
          className="flex items-center gap-3 flex-1"
        >
          <Avatar size="md">
            <AvatarImage src={userData.profile_images?.[0]} alt={userData.nickname} />
            <AvatarFallback>{userData.nickname?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-sm text-foreground">{userData.nickname}, {userData.age}</h3>
            <p className="text-xs text-muted-foreground">{userData.location}</p>
          </div>
        </button>
        <FollowButton
          targetUserId={userId}
          currentUserId={currentUserId}
          variant="default"
        />
      </CardContent>
    </Card>
  );
}
