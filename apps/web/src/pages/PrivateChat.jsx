import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatService, userService, socketService } from '@/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useChatRoom, usePresence } from '@/api/hooks/useSocket';
import { ChatSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import PrivateChatHeader from '@/components/chat/PrivateChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import { ICE_BREAKERS, ErrorScreen } from '@/components/chat/PrivateChatConstants';
import { useToast } from '@/components/ui/use-toast';

export default function PrivateChat() {
  const { toast } = useToast();
  const navigate = useNavigate(), location = useLocation();
  const messagesEndRef = useRef(null), typingTimeoutRef = useRef(null);
  const { currentUser, isLoading } = useCurrentUser();
  const [message, setMessage] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const params = new URLSearchParams(location.search);
  const chatId = params.get('chatId') || params.get('id'), otherUserId = params.get('userId');
  const isDemo = chatId?.startsWith('demo-');

  const { messages: realtimeMessages, typingUsers, isJoined, sendMessage: sendSocketMessage, sendTyping } = useChatRoom(chatId);

  const { data: chat, isError: chatError } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      try { return (await chatService.getChatById(chatId)).chat; }
      catch (e) { if (e.response?.status === 404) return null; throw e; }
    },
    enabled: !!chatId && !isDemo, retry: false,
  });

  const { data: initialMessages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      try { return (await chatService.getMessages(chatId, { limit: 100 })).messages || []; }
      catch (e) { if (e.response?.status === 404) return []; throw e; }
    },
    enabled: !!chatId && !isDemo, retry: false,
  });

  const messages = React.useMemo(() => {
    const all = [...initialMessages];
    realtimeMessages.forEach((msg) => { if (!all.some((m) => m.id === msg.id)) all.push(msg); });
    return all.sort((a, b) => new Date(a.created_date || a.createdAt) - new Date(b.created_date || b.createdAt));
  }, [initialMessages, realtimeMessages]);

  const { data: otherUser } = useQuery({
    queryKey: ['user', otherUserId, chat?.otherUser?.id],
    queryFn: async () => {
      const targetId = otherUserId || chat?.otherUser?.id;
      if (!targetId) return null;
      try { return (await userService.getUserById(targetId)).user; }
      catch { return { id: targetId, nickname: 'User', age: null, profile_images: [`https://i.pravatar.cc/150?u=${targetId}`] }; }
    },
    enabled: !!otherUserId || (!!chat && !!currentUser),
  });

  const presenceId = otherUser?.id || otherUserId;
  const { isOnline } = usePresence(presenceId ? [presenceId] : []);
  const isOtherUserOnline = presenceId ? isOnline(presenceId) : false;
  const isOtherUserTyping = presenceId ? typingUsers[presenceId] : false;

  const handleTyping = useCallback((value) => {
    setMessage(value);
    if (!isTyping) { setIsTyping(true); sendTyping(true); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); sendTyping(false); }, 2000);
  }, [isTyping, sendTyping]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      if (isJoined && socketService.isConnected()) {
        const r = await sendSocketMessage(data.content);
        if (r.success) return r.data;
      }
      return await chatService.sendMessage(chatId, data);
    },
    onSuccess: () => { setMessage(''); setIsTyping(false); sendTyping(false); scrollToBottom(); },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !chatId || !currentUser) return;
    sendMessageMutation.mutate({ content: message, type: 'text' });
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleBlockUser = async () => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try { await userService.blockUser(otherUserId); toast({ title: 'Success', description: 'User blocked successfully' }); navigate(createPageUrl('SharedSpace')); }
    catch { toast({ title: 'Error', description: 'Error blocking user', variant: 'destructive' }); }
  };

  const goBack = () => navigate(createPageUrl('SharedSpace'));
  const loadingSkeleton = <div className="min-h-screen bg-background p-4"><ChatSkeleton count={6} /></div>;

  if (isLoading) return loadingSkeleton;
  if (chatId && !isDemo && chatError) return <ErrorScreen title="Chat Not Found" description="This conversation doesn't exist or has been deleted." onBack={goBack} />;
  if (!otherUser) {
    if (!otherUserId && !chat) return <ErrorScreen title="Unable to Load Chat" description="Could not find the user for this conversation." onBack={goBack} />;
    return loadingSkeleton;
  }

  const isTemporary = chat?.is_temporary && !chat?.is_permanent;
  const expiresAt = chat?.expires_at ? new Date(chat.expires_at) : null;
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - new Date()) / 1000 / 60 / 60)) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="ltr">
      <PrivateChatHeader
        otherUser={otherUser} otherUserId={otherUserId} chatId={chatId}
        isTemporary={isTemporary} timeLeft={timeLeft}
        isOtherUserOnline={isOtherUserOnline} isOtherUserTyping={isOtherUserTyping}
        showActions={showActions} onToggleActions={() => setShowActions(!showActions)}
        onNavigate={navigate} onBlockUser={handleBlockUser}
      />
      <MessageList ref={messagesEndRef} messages={messages} currentUserId={currentUser.id} isOtherUserTyping={isOtherUserTyping} otherUserNickname={otherUser?.nickname} />
      <ChatInput
        message={message} onMessageChange={handleTyping} onSend={handleSendMessage}
        showIceBreakers={showIceBreakers} onToggleIceBreakers={() => setShowIceBreakers(!showIceBreakers)}
        iceBreakers={ICE_BREAKERS} showIceBreakerPanel={showIceBreakers && messages.length === 0}
        onSelectIceBreaker={(text) => { setMessage(text); setShowIceBreakers(false); }}
      />
    </div>
  );
}
