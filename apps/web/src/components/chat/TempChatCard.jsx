import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';

export function getTimeRemaining(expiresAt) {
  if (!expiresAt) return 'Expired';
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function TempChatCard({ chat, onAvatarClick }) {
  const navigate = useNavigate();
  const otherUserId = chat.otherUser?.id;
  const otherUserName = chat.otherUser?.first_name;
  const otherUserImage = chat.otherUser?.profile_images?.[0];
  const timeRemaining = getTimeRemaining(chat.expires_at);
  const isExpired = timeRemaining === 'Expired';

  return (
    <Card
      variant={isExpired ? "default" : "interactive"}
      onClick={() => !isExpired && navigate(createPageUrl(`PrivateChat?chatId=${chat.id}`))}
      className={`cursor-pointer ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="p-4 flex items-center gap-4">
        <button
          className="relative cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => onAvatarClick(e, otherUserId, otherUserName, otherUserImage, chat.id)}
          title="Click to view bio"
        >
          <Avatar size="lg">
            <AvatarImage
              src={otherUserImage || `https://i.pravatar.cc/150?u=${otherUserId}`}
              alt={otherUserName || 'User'}
            />
            <AvatarFallback>{otherUserName?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          {chat.status === 'active' && !isExpired && (
            <AvatarStatus status="online" size="lg" />
          )}
        </button>

        <div className="flex-1 text-right">
          <h3 className="font-semibold text-foreground mb-1">
            {otherUserName || 'Unknown user'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {chat.status === 'pending' && (
              <>
                <Clock className="w-4 h-4" />
                <span>Waiting for approval</span>
              </>
            )}
            {chat.status === 'active' && (
              <>
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Active</span>
              </>
            )}
            {isExpired && (
              <span className="text-destructive">Expired</span>
            )}
          </div>
        </div>

        {!isExpired && (
          <div className="text-left">
            <Badge variant="secondary-soft" size="sm" className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeRemaining}</span>
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
