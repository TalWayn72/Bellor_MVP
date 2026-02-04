import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function TemporaryChats() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [filterStatus, setFilterStatus] = useState('all');

  // Demo temporary chats for new users
  const getDemoTemporaryChats = () => [
    {
      id: 'demo-temp-chat-1',
      user1_id: currentUser?.id || 'demo',
      user2_id: 'demo-user-1',
      user2_name: 'Sarah',
      user2_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      is_temporary: true,
      status: 'active',
      expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      created_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-temp-chat-2',
      user1_id: 'demo-user-2',
      user2_id: currentUser?.id || 'demo',
      user1_name: 'David',
      user1_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      is_temporary: true,
      status: 'pending',
      expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo-temp-chat-3',
      user1_id: currentUser?.id || 'demo',
      user2_id: 'demo-user-3',
      user2_name: 'Michael',
      user2_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      is_temporary: true,
      status: 'active',
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      created_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data: temporaryChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['temporaryChats', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoTemporaryChats();
      try {
        const result = await chatService.getChats({ is_temporary: true, limit: 50 });
        const chats = result.chats || [];
        // Return demo data if no real chats
        return chats.length > 0 ? chats : getDemoTemporaryChats();
      } catch (error) {
        return getDemoTemporaryChats();
      }
    },
    enabled: !!currentUser,
  });

  const filteredChats = temporaryChats.filter(chat => {
    if (filterStatus === 'all') return true;
    return chat.status === filterStatus;
  });

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'Expired';
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading || chatsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/SharedSpace" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Temporary Chats</h1>
          </div>
          <div className="min-w-[24px]"></div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-card rounded-2xl p-2 shadow-sm border border-border">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            }`}
          >
            All ({temporaryChats.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'pending'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            }`}
          >
            Pending ({temporaryChats.filter(c => c.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              filterStatus === 'active'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:bg-muted'
            }`}
          >
            Active ({temporaryChats.filter(c => c.status === 'active').length})
          </button>
        </div>

        {/* Chats List */}
        {filteredChats.length === 0 ? (
          <EmptyState
            variant="messages"
            title="No temporary chats"
            description={
              filterStatus === 'all'
                ? 'Send a temporary chat request to someone to start a conversation'
                : `No chats with ${filterStatus === 'pending' ? 'pending' : 'active'} status`
            }
            actionLabel="Explore Feed"
            onAction={() => navigate(createPageUrl('SharedSpace'))}
          />
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => {
              const otherUserId = chat.user1_id === currentUser.id ? chat.user2_id : chat.user1_id;
              const otherUserName = chat.user1_id === currentUser.id ? chat.user2_name : chat.user1_name;
              const otherUserImage = chat.user1_id === currentUser.id ? chat.user2_image : chat.user1_image;
              const timeRemaining = getTimeRemaining(chat.expires_at);
              const isExpired = timeRemaining === 'Expired';

              return (
                <Card
                  key={chat.id}
                  variant={isExpired ? "default" : "interactive"}
                  onClick={() => !isExpired && navigate(createPageUrl(`PrivateChat?chatId=${chat.id}`))}
                  className={`cursor-pointer ${isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="relative">
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
                    </div>

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
            })}
          </div>
        )}
      </div>
    </div>
  );
}