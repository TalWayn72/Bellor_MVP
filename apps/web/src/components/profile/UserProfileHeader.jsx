import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent, CardImage } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import FollowButton from '@/components/profile/FollowButton';

export default function UserProfileHeader({
  viewedUser,
  userId,
  currentUser,
  isLiked,
  followersCount,
  followingCount,
  activeTab,
  onTabChange,
  tabs,
}) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="px-4 pt-4">
        <Card variant="profile" className="rounded-3xl">
          <CardImage
            src={viewedUser?.profile_images?.[0] || `https://i.pravatar.cc/400?u=${viewedUser?.id}`}
            alt="Profile"
          />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {viewedUser.is_verified && (
              <Badge variant="verified" size="lg" className="h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </Badge>
            )}
            {!isLiked && (
              <Card variant="glass" className="px-4 py-2 shadow-lg">
                <p className="text-xs font-medium">Are You interested</p>
              </Card>
            )}
          </div>
        </Card>
      </div>

      <div className="px-4 mt-4 flex items-center gap-3">
        <Card
          variant="interactive"
          className="cursor-pointer"
          onClick={() => navigate(createPageUrl(`FollowingList?userId=${userId}&tab=followers`))}
        >
          <CardContent className="flex items-center gap-2 p-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Followers</p>
              <p className="text-sm font-bold">{followersCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          variant="interactive"
          className="cursor-pointer"
          onClick={() => navigate(createPageUrl(`FollowingList?userId=${userId}&tab=following`))}
        >
          <CardContent className="flex items-center gap-2 p-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Following</p>
              <p className="text-sm font-bold">{followingCount}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex-1">
          <FollowButton
            targetUserId={userId}
            currentUserId={currentUser?.id}
            variant="default"
          />
        </div>
      </div>

      <div className="px-4 mt-4">
        <Card className="p-1">
          <div className="flex">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl ${activeTab === tab.id ? 'bg-foreground text-background' : ''}`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
