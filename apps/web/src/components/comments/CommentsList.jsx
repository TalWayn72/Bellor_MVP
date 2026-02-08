import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/api';
import { Heart, Reply } from 'lucide-react';

export default function CommentsList({ responseId, currentUser }) {
  // Demo comments (Comment service can be added in future)
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', responseId],
    queryFn: async () => {
      // Return empty array - comments would come from a backend service
      return [];
    },
    enabled: !!responseId,
  });

  if (isLoading) {
    return (
      <div className="py-2 text-center">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-xs text-gray-500">אין תגובות עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} currentUser={currentUser} />
      ))}
    </div>
  );
}

function CommentItem({ comment, currentUser }) {
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true;
    const fallback = {
      nickname: 'User',
      profile_images: [`https://i.pravatar.cc/150?u=${comment.user_id}`]
    };
    const fetchUser = async () => {
      try {
        const result = await userService.getUserById(comment.user_id);
        if (!isMounted) return;
        const user = result?.user || result;
        setUserData(user || fallback);
      } catch (error) {
        if (isMounted) setUserData(fallback);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [comment.user_id]);

  if (!userData) return null;

  return (
    <div className="flex gap-2">
      <img
        src={userData.profile_images?.[0] || `https://i.pravatar.cc/150?u=${comment.user_id}`}
        alt={userData.nickname || 'User'}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-2xl px-3 py-2">
          <p className="font-semibold text-xs mb-0.5">{userData.nickname}</p>
          <p className="text-sm text-gray-800">{comment.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-3">
          <button className="text-xs text-gray-500 hover:text-gray-700">
            {new Date(comment.created_date).toLocaleDateString('he-IL', { 
              day: 'numeric', 
              month: 'short' 
            })}
          </button>
          {comment.likes_count > 0 && (
            <span className="text-xs text-gray-500">{comment.likes_count} likes</span>
          )}
        </div>
      </div>
    </div>
  );
}