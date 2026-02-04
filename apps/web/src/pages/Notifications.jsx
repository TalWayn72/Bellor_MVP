import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, userService, socketService } from '@/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, X, ChevronDown } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus, AvatarBadge } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('today');
  const { currentUser, isLoading } = useCurrentUser();

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = () => {
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const unsubNotif = socketService.on('notification:new', handleNewNotification);
    const unsubMessage = socketService.on('chat:message:new', handleNewMessage);

    return () => {
      unsubNotif();
      unsubMessage();
    };
  }, [queryClient]);

  const getDemoNotifications = () => [
    {
      id: 'demo-notif-1',
      user_id: currentUser?.id,
      type: 'new_message',
      title: 'New Message',
      message: 'Someone sent you a message',
      related_id: 'demo-user-1',
      created_date: new Date().toISOString(),
      is_read: false
    },
    {
      id: 'demo-notif-2',
      user_id: currentUser?.id,
      type: 'match',
      title: 'New Match',
      message: 'You have a new match!',
      related_id: 'demo-user-2',
      created_date: new Date(Date.now() - 3600000).toISOString(),
      is_read: false
    }
  ];

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoNotifications();
      try {
        const result = await notificationService.getNotifications();
        const dbNotifications = result.notifications || [];
        return dbNotifications.length > 0 ? dbNotifications : getDemoNotifications();
      } catch (error) {
        return getDemoNotifications();
      }
    },
    enabled: !!currentUser,
  });

  const tabs = [
    { id: 'today', label: 'Today Chat' },
    { id: 'crushes', label: 'Crushes' },
    { id: 'messages', label: 'Messages' }
  ];

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'today':
        return notifications.filter(n => n.type === 'new_message' || n.type === 'new_chat');
      case 'crushes':
        return notifications.filter(n => n.type === 'match');
      case 'messages':
        return notifications.filter(n => n.type === 'new_message');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card sticky top-0 z-10 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <header className="shadow-sm">
            <div className="px-4 py-4 flex items-center">
              <div className="min-w-[24px]">
                <div className="w-6"></div>
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
              </div>
              <BackButton variant="header" position="relative" fallback="/SharedSpace" />
            </div>
          </header>

          {/* Tabs */}
          <div className="px-4">
            <div className="flex gap-6 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium relative transition-colors ${
                    activeTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        <div className="space-y-3">
          {filteredNotifications.length > 0 && (
            filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          )}
          {filteredNotifications.length === 0 && (
            <EmptyState
              variant="notifications"
              title="No notifications yet"
              description="You're all caught up! New notifications will appear here."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ notification }) {
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
              {relatedUser ? `${relatedUser.nickname}${relatedUser.age ? ` • ${relatedUser.age}` : ''}` : 'User'}
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
