/**
 * UserBioDialog
 * Shows user bio and basic info when clicking on user avatar
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { MapPin, User, ExternalLink, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createPageUrl, formatLocation, transformUser } from '@/utils';

export default function UserBioDialog({
  isOpen,
  onClose,
  userId,
  userName,
  userImage,
  onStartChat,
  showChatButton = true
}) {
  const navigate = useNavigate();

  // Fetch full user data when dialog opens
  const { data: userData, isLoading } = useQuery({
    queryKey: ['userBio', userId],
    queryFn: async () => {
      if (!userId || userId.startsWith('demo-')) {
        // Return demo data for demo users
        return {
          id: userId,
          nickname: userName || 'Demo User',
          bio: 'This is a demo user profile. In the real app, you would see the actual user bio here with their interests, hobbies, and more about them.',
          profile_images: [userImage],
          location: { city: 'Tel Aviv', country: 'Israel' },
          gender: 'other',
          is_verified: false,
        };
      }

      try {
        const result = await userService.getUserById(userId);
        return transformUser(result.user || result);
      } catch (error) {
        console.error('[UserBioDialog] Error fetching user:', error);
        return null;
      }
    },
    enabled: isOpen && !!userId,
  });

  const handleViewProfile = () => {
    onClose();
    navigate(createPageUrl(`UserProfile?id=${userId}`));
  };

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          {/* Avatar */}
          <Avatar size="xl" className="mb-4">
            <AvatarImage
              src={userData?.profile_images?.[0] || userImage || `https://i.pravatar.cc/150?u=${userId}`}
              alt={userData?.nickname || userName || 'User'}
            />
            <AvatarFallback className="text-2xl">
              {(userData?.nickname || userName || '?').charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Name and verification */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-foreground">
              {userData?.nickname || userName || 'Unknown User'}
            </h2>
            {userData?.age && (
              <span className="text-lg text-muted-foreground">• {userData.age}</span>
            )}
            {userData?.is_verified && (
              <Badge variant="verified" size="sm">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </Badge>
            )}
          </div>

          {/* Location */}
          {userData?.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{formatLocation(userData.location)}</span>
            </div>
          )}

          {/* Bio */}
          {isLoading ? (
            <div className="w-full space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          ) : userData?.bio ? (
            <p className="text-sm text-foreground leading-relaxed px-4 mb-4 max-h-32 overflow-y-auto">
              {userData.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-4">
              No bio available
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 w-full mt-2">
            <Button
              variant="outline"
              onClick={handleViewProfile}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Profile
            </Button>

            {showChatButton && (
              <Button
                variant="default"
                onClick={handleStartChat}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
