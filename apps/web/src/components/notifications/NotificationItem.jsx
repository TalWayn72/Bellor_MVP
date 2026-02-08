import React, { useState } from 'react';
import { userService } from '@/api';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus, AvatarBadge } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function NotificationItem({ notification }) {
  const [showActions, setShowActions] = useState(false);
  const [relatedUser, setRelatedUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      if (!notification.related_id) return;
      try {
        const result = await userService.getUserById(notification.related_id);
        if (result.user) {
          setRelatedUser(result.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [notification.related_id]);

  return (
    <Card variant="interactive" className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="relative">
          <Avatar size="md">
            <AvatarImage
              src={relatedUser?.profile_images?.[0] || `https://i.pravatar.cc/150?u=${notification.related_id}`}
              alt="User"
            />
            <AvatarFallback>{relatedUser?.nickname?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <AvatarStatus status="online" size="md" />
          {relatedUser?.is_verified && <AvatarBadge verified size="md" />}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">
              {relatedUser ? `${relatedUser.nickname}${relatedUser.age ? ` \u2022 ${relatedUser.age}` : ''}` : 'User'}
            </h3>
            {relatedUser?.is_verified && (
              <Badge variant="verified" size="sm" className="h-3.5 px-1">
                <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{notification.message}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary-soft" size="sm">
            {new Date(notification.created_date).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Badge>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${showActions ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </CardContent>

      {showActions && (
        <div className="px-4 pb-4 flex gap-3">
          <Button
            onClick={() => setShowActions(false)}
            variant="outline"
            className="flex-1"
          >
            CLOSE
          </Button>
          <Button className="flex-1">
            KEEP CHATTING
          </Button>
        </div>
      )}
    </Card>
  );
}
