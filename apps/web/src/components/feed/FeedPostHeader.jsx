import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function FeedPostHeader({ userData, response, isPlaying, onPlayVoice }) {
  const navigate = useNavigate();

  return (
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
            <h3 className="font-semibold text-sm">{userData.nickname} &bull; {userData.age}</h3>
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
        <button onClick={onPlayVoice} className="p-1.5 rounded-lg bg-muted">
          <Volume2 className={`w-5 h-5 ${isPlaying ? 'text-info' : 'text-muted-foreground'}`} />
        </button>
      )}
    </div>
  );
}
