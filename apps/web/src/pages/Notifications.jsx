import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, userService, socketService } from '@/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ListSkeleton, EmptyState } from '@/components/states';
import { getDemoNotifications } from '@/data/demoData';
import NotificationItem from '@/components/notifications/NotificationItem';

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('today');
  const { currentUser, isLoading } = useCurrentUser();

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    const unsubNotif = socketService.on('notification:new', handleNewNotification);
    const unsubMessage = socketService.on('chat:message:new', handleNewMessage);
    return () => { unsubNotif(); unsubMessage(); };
  }, [queryClient]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoNotifications(currentUser?.id);
      try {
        const result = await notificationService.getNotifications();
        const dbNotifications = result.notifications || [];
        return dbNotifications.length > 0 ? dbNotifications : getDemoNotifications(currentUser?.id);
      } catch (error) {
        return getDemoNotifications(currentUser?.id);
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
      case 'today': return notifications.filter(n => n.type === 'new_message' || n.type === 'new_chat');
      case 'crushes': return notifications.filter(n => n.type === 'match');
      case 'messages': return notifications.filter(n => n.type === 'new_message');
      default: return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6"><ListSkeleton count={5} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card sticky top-0 z-10 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <header className="shadow-sm">
            <div className="px-4 py-4 flex items-center">
              <div className="min-w-[24px]"><div className="w-6"></div></div>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
              </div>
              <BackButton variant="header" position="relative" fallback="/SharedSpace" />
            </div>
          </header>
          <div className="px-4">
            <div className="flex gap-6 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium relative transition-colors ${
                    activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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

      <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
        <div className="space-y-3">
          {filteredNotifications.length > 0 && filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
          {filteredNotifications.length === 0 && (
            <EmptyState variant="notifications" title="No notifications yet" description="You're all caught up! New notifications will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}
