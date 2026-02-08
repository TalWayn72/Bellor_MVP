import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';

export default function ChatCarousel({ activeChatUsers, onNavigate }) {
  return (
    <Card className="mx-0 rounded-none border-x-0">
      <CardContent className="px-4 py-2">
        {activeChatUsers.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {activeChatUsers.map((user) => (
              <button
                key={user.chatId}
                onClick={() => onNavigate(createPageUrl(`UserProfile?id=${user.userId}`))}
                className="flex-shrink-0"
              >
                <div className="relative">
                  <Avatar size="lg" className="border-2 border-background hover:border-border transition-colors">
                    <AvatarImage
                      src={user.image || `https://i.pravatar.cc/150?u=${user.userId}`}
                      alt={user.name}
                    />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {user.isOnline && <AvatarStatus status="online" size="lg" />}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">{'\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05d9\u05d5\u05ea \u05e9\u05dc\u05da \u05d9\u05d5\u05e4\u05d9\u05e2\u05d5 \u05db\u05d0\u05df'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
