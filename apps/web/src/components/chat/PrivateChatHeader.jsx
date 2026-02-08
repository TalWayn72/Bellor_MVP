import React from 'react';
import { Video, MoreVertical } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';

export default function PrivateChatHeader({
  otherUser,
  otherUserId,
  chatId,
  isTemporary,
  timeLeft,
  isOtherUserOnline,
  isOtherUserTyping,
  showActions,
  onToggleActions,
  onNavigate,
  onBlockUser,
}) {
  return (
    <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <div className="relative">
            <Avatar size="md">
              <AvatarImage
                src={otherUser?.profile_images?.[0] || `https://i.pravatar.cc/150?u=${otherUser?.id}`}
                alt={otherUser?.nickname}
              />
              <AvatarFallback>{otherUser?.nickname?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <AvatarStatus status="online" size="md" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-foreground">{otherUser.nickname}</h1>
            {isTemporary && timeLeft !== null ? (
              <Badge variant="warning" size="sm">&#9200; {timeLeft}h left</Badge>
            ) : isOtherUserTyping ? (
              <span className="text-xs text-primary animate-pulse">typing...</span>
            ) : (
              <span className={`text-xs ${isOtherUserOnline ? 'text-success' : 'text-muted-foreground'}`}>
                {isOtherUserOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate(createPageUrl(`VideoDate?chatId=${chatId}`))}
          >
            <Video className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={onToggleActions}>
              <MoreVertical className="w-5 h-5" />
            </Button>
            {showActions && (
              <Card className="absolute right-0 top-full mt-2 py-1 w-48 z-20 shadow-lg border border-border">
                <button
                  onClick={() => otherUserId && otherUserId !== 'undefined' && onNavigate(createPageUrl(`UserProfile?id=${otherUserId}`))}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={onBlockUser}
                  className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Block User
                </button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
