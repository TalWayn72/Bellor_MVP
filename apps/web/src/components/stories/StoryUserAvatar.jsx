import React from 'react';
import { userService } from '@/api';

export default function StoryUserAvatar({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(userId);
        if (result.user) setUser(result.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [userId]);

  return (
    <div className="absolute top-3 left-3">
      <img
        src={user?.profile_images?.[0] || `https://i.pravatar.cc/50?u=${userId}`}
        alt="User"
        className="w-8 h-8 rounded-full border-2 border-white"
      />
    </div>
  );
}
