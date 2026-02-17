import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/navigation/BackButton';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { ListSkeleton, EmptyState } from '@/components/states';
import UserBioDialog from '../components/user/UserBioDialog';
import { getDemoTempChats } from '@/data/demoData';
import TempChatCard from '@/components/chat/TempChatCard';

export default function TemporaryChats() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);

  const handleAvatarClick = (e, userId, userName, userImage, chatId) => {
    e.stopPropagation();
    setSelectedUser({ userId, userName, userImage, chatId });
    setIsBioDialogOpen(true);
  };

  const handleStartChatFromDialog = () => {
    if (selectedUser?.chatId) {
      navigate(createPageUrl(`PrivateChat?chatId=${selectedUser.chatId}`));
    }
  };

  const { data: temporaryChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['temporaryChats', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return getDemoTempChats(currentUser?.id);
      try {
        const result = await chatService.getChats({ is_temporary: true, limit: 50 });
        const chats = result.chats || [];
        return chats.length > 0 ? chats : getDemoTempChats(currentUser?.id);
      } catch {
        return getDemoTempChats(currentUser?.id);
      }
    },
    enabled: !!currentUser,
  });

  const filteredChats = temporaryChats.filter(chat => {
    if (filterStatus === 'all') return true;
    return chat.status === filterStatus;
  });

  const filterButtons = [
    { key: 'all', label: `All (${temporaryChats.length})` },
    { key: 'pending', label: `Pending (${temporaryChats.filter(c => c.status === 'pending').length})` },
    { key: 'active', label: `Active (${temporaryChats.filter(c => c.status === 'active').length})` },
  ];

  if (isLoading || chatsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="flex gap-2 mb-6 bg-card rounded-2xl p-2 shadow-sm border border-border">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                filterStatus === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

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
            {filteredChats.map((chat) => (
              <TempChatCard key={chat.id} chat={chat} onAvatarClick={handleAvatarClick} />
            ))}
          </div>
        )}
      </div>

      <UserBioDialog
        isOpen={isBioDialogOpen}
        onClose={() => { setIsBioDialogOpen(false); setSelectedUser(null); }}
        userId={selectedUser?.userId}
        userName={selectedUser?.userName}
        userImage={selectedUser?.userImage}
        onStartChat={handleStartChatFromDialog}
        showChatButton={true}
      />
    </div>
  );
}
