import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService, responseService, likeService, followService, chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Heart, X, MapPin, MessageCircle, Users, User, Search, Star } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardImage } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ProfileSkeleton } from '@/components/states';
import { createPageUrl, formatLocation, transformUser } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import FollowButton from '../components/profile/FollowButton';

export default function UserProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('about');
  const { currentUser, isLoading } = useCurrentUser();
  const [isLiked, setIsLiked] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  useEffect(() => {
    const checkLiked = async () => {
      if (currentUser && userId) {
        try {
          const result = await likeService.checkLiked(userId);
          setIsLiked(result.liked);
        } catch (error) {
          // Ignore error
        }
      }
    };
    checkLiked();
  }, [currentUser, userId]);

  // Fetch viewed user data (userService handles demo users automatically)
  const { data: viewedUser } = useQuery({
    queryKey: ['viewedUser', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const result = await userService.getUserById(userId);
        const user = result?.user || result;
        // Transform user to ensure consistent data format (nickname, age, location_display)
        return user ? transformUser(user) : null;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    enabled: !!userId,
  });

  // Fetch user responses (responseService handles demo users automatically)
  const { data: responses = [] } = useQuery({
    queryKey: ['userResponses', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const result = await responseService.getUserResponses(userId, { limit: 10 });
        return result.responses || [];
      } catch (error) {
        console.error('Error fetching responses:', error);
        return [];
      }
    },
    enabled: !!userId,
  });

  // Fetch followers/following counts
  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', userId],
    queryFn: async () => {
      const result = await followService.getUserFollowers(userId);
      return result.pagination?.total || 0;
    },
    enabled: !!userId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', userId],
    queryFn: async () => {
      const result = await followService.getUserFollowing(userId);
      return result.pagination?.total || 0;
    },
    enabled: !!userId,
  });

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'book', label: 'Book' },
  ];

  const handleLike = async () => {
    try {
      if (isLiked) {
        await likeService.unlikeUser(userId);
        setIsLiked(false);
      } else {
        await likeService.likeUser(userId, 'ROMANTIC');
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSendMessage = async (message) => {
    try {
      // Create or get existing chat
      const result = await chatService.createOrGetChat(userId);
      const chatId = result.chat.id;

      // Send message
      await chatService.sendMessage(chatId, {
        content: message,
        type: 'text'
      });

      setShowMessageDialog(false);
      alert('Message sent successfully!');
      } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  if (isLoading || !viewedUser) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <div className="min-w-[24px]">
            <div className="w-6"></div>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">{viewedUser.nickname} • {viewedUser.age}</h1>
          </div>
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-24">
        {/* Profile Image Section */}
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

          {/* Follow Stats + Button */}
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

          {/* Tabs */}
          <div className="px-4 mt-4">
            <Card className="p-1">
              <div className="flex">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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

        {/* Content */}
        <div className="px-4 mt-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Bio Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {viewedUser.bio}
                  </p>
                </CardContent>
              </Card>

              {/* Responses Grid */}
              {responses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Shared Moments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {responses
                        .filter(r => r.response_type === 'drawing' || r.response_type === 'video')
                        .slice(0, 4)
                        .map((response) => (
                          <div key={response.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                            {response.response_type === 'drawing' && response.content && (
                              <img
                                src={response.content}
                                alt="Response"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {response.response_type === 'video' && response.content && (
                              <video
                                src={response.content}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info Section */}
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{formatLocation(viewedUser.location)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{viewedUser.gender === 'female' ? 'נקבה' : 'זכר'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      מחפש/ת {viewedUser.looking_for === 'female' ? 'נשים' : 'גברים'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Interests */}
              {viewedUser.interests && viewedUser.interests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {viewedUser.interests.map((interest, idx) => (
                        <Badge key={idx} variant="secondary" size="lg">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'book' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{viewedUser.nickname}'s Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">התוכן ששותף</p>
                </CardContent>
              </Card>

              {/* All User Responses Grid */}
              <div className="grid grid-cols-2 gap-3">
                {responses.map((response) => (
                  <Card key={response.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      {response.response_type === 'text' && (
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <p className="text-xs text-foreground text-center line-clamp-4">
                            {response.text_content}
                          </p>
                        </div>
                      )}
                      {response.response_type === 'drawing' && response.content && (
                        <img
                          src={response.content}
                          alt="Drawing"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {response.response_type === 'video' && response.content && (
                        <video
                          src={response.content}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {response.response_type === 'voice' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground">
                        {new Date(response.created_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions - Phase 1: Dating */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex gap-3 items-center">
          <Button
            onClick={() => navigate(createPageUrl('SharedSpace'))}
            variant="outline"
            size="icon-lg"
            className="rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Romantic Interest */}
          <Button
            onClick={async () => {
              try {
                await likeService.likeUser(userId, 'ROMANTIC');
                alert('הראת עניין רומנטי!');
              } catch (error) {
                console.error('Error:', error);
              }
            }}
            variant="love"
            size="xl"
            className="flex-1 gap-2"
          >
            <Heart className="w-5 h-5" />
            עניין רומנטי
          </Button>

          {/* Positive Feedback */}
          <Button
            onClick={async () => {
              try {
                await likeService.likeUser(userId, 'POSITIVE');
                alert('נתת פידבק חיובי!');
              } catch (error) {
                console.error('Error:', error);
              }
            }}
            variant="premium"
            size="xl"
            className="flex-1 gap-2"
          >
            <Star className="w-5 h-5" />
            פידבק חיובי
          </Button>

          {/* Chat Request */}
          <Button
            onClick={() => setShowMessageDialog(true)}
            variant="outline"
            size="icon-lg"
            className="rounded-full border-info text-info hover:bg-info/10"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-lg" aria-describedby="message-dialog-description">
          <DialogHeader>
            <DialogTitle>Send message to {viewedUser.nickname}</DialogTitle>
            <p id="message-dialog-description" className="text-sm text-muted-foreground">
              Write a private message to start a conversation
            </p>
          </DialogHeader>
          <textarea
            id="messageInput"
            placeholder="Write your message..."
            className="w-full h-32 border-2 border-input rounded-xl p-3 text-sm resize-none focus:border-primary focus:ring-primary"
          />
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button
              onClick={() => setShowMessageDialog(false)}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const message = document.getElementById('messageInput').value;
                if (message.trim()) {
                  handleSendMessage(message);
                }
              }}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
