import React from 'react';
import { userService } from '@/api';

export default function StoryUserAvatar({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (isMounted && result.user) setUser(result.user);
      } catch (error) {
        // User fetch failed - use fallback avatar
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <div className="absolute top-3 left-3">
      <img
        src={user?.profile_images?.[0] || `https://i.pravatar.cc/50?u=${userId}`}
        alt="User"
        className="w-8 h-8 rounded-full border-2 border-white"
        loading="lazy"
      />
    </div>
  );
}
