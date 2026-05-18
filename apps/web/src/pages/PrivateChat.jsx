import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatService, socketService, userService } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { useChatRoom, usePresence } from '@/api/hooks/useSocket';
import { ChatSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import { usePrivateChatActions } from '@/components/hooks/usePrivateChatActions';
import { usePrivateChatReadReceipts } from '@/components/hooks/usePrivateChatReadReceipts';
import { getDemoMessages, isDemoId } from '@/data/demoData';
import PrivateChatHeader from '@/components/chat/PrivateChatHeader';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import IncomingVideoCallDialog from '@/components/chat/IncomingVideoCallDialog';
import { buildVideoCallUrl, startVideoCallInvite } from '@/components/chat/videoCallInvite';
import { ICE_BREAKERS, ErrorScreen } from '@/components/chat/PrivateChatConstants';
import { useToast } from '@/components/ui/use-toast';

export default function PrivateChat() {
  const { toast } = useToast();
  const navigate = useNavigate(), location = useLocation();
  const messagesEndRef = useRef(null);
  const { currentUser, isLoading } = useCurrentUser();
  const [showActions, setShowActions] = useState(false), [showIceBreakers, setShowIceBreakers] = useState(false);
  const params = new URLSearchParams(location.search);
  const chatId = params.get('chatId') || params.get('id'), routeOtherUserId = params.get('userId');
  const isDemo = isDemoId(chatId);
  const {
    messages: realtimeMessages,
    typingUsers,
    incomingCall,
    isJoined,
    sendMessage: sendSocketMessage,
    sendTyping,
    markAsRead,
    clearIncomingCall,
  } = useChatRoom(chatId, currentUser?.id);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const { message, isUploading, localMessages, handleTyping, handleSendMessage, handleSendImage, handleSendVoice, handleSendDrawing, handleBlockUser, cleanup } =
    usePrivateChatActions({ chatId, currentUser, isDemo, isJoined, sendSocketMessage, sendTyping, scrollToBottom, toast, navigate });

  const { data: chat, isError: chatError } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      try { return (await chatService.getChatById(chatId)).chat; }
      catch (e) { if (e.response?.status === 404) return null; throw e; }
    },
    enabled: !!chatId && !isDemo, retry: false,
  });
  const chatOtherUser = chat?.otherUser || chat?.other_user;
  const resolvedOtherUserId = routeOtherUserId || chatOtherUser?.id;

  const { data: initialMessages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      try { return (await chatService.getMessages(chatId, { limit: 100 })).messages || []; }
      catch (e) { if (e.response?.status === 404) return []; throw e; }
    },
    enabled: !!chatId && !isDemo, retry: false,
  });

  const demoMessages = React.useMemo(() => {
    if (!isDemo || !currentUser) return [];
    return getDemoMessages(chatId, currentUser.id);
  }, [isDemo, chatId, currentUser]);

  const messages = React.useMemo(() => {
    const all = [...(isDemo ? demoMessages : initialMessages), ...localMessages];
    realtimeMessages.forEach((msg) => { if (!all.some((m) => m.id === msg.id)) all.push(msg); });
    return all.sort((a, b) => new Date(a.created_date || a.createdAt) - new Date(b.created_date || b.createdAt));
  }, [isDemo, demoMessages, initialMessages, realtimeMessages, localMessages]);
  usePrivateChatReadReceipts({ chatId, currentUserId: currentUser?.id, isDemo, messages, markAsRead });

  const { data: otherUser } = useQuery({
    queryKey: ['user', resolvedOtherUserId],
    queryFn: async () => {
      if (!resolvedOtherUserId) return null;
      try { return (await userService.getUserById(resolvedOtherUserId)).user; }
      catch { return { id: resolvedOtherUserId, nickname: 'User', age: null, profile_images: [`https://i.pravatar.cc/150?u=${resolvedOtherUserId}`] }; }
    },
    enabled: !!resolvedOtherUserId && !!currentUser,
  });
  const metadataOtherUser = React.useMemo(() => {
    if (!chatOtherUser?.id) return null;
    return {
      ...chatOtherUser,
      nickname: chatOtherUser.nickname || chatOtherUser.first_name || chatOtherUser.firstName || chatOtherUser.name || 'User',
      profile_images: chatOtherUser.profile_images || chatOtherUser.profileImages || [],
    };
  }, [chatOtherUser]);
  const resolvedOtherUser = otherUser || metadataOtherUser;

  const presenceId = resolvedOtherUser?.id || resolvedOtherUserId;
  const { isOnline } = usePresence(presenceId ? [presenceId] : []);
  const isOtherUserOnline = presenceId ? isOnline(presenceId) : false;
  const isOtherUserTyping = presenceId ? typingUsers[presenceId] : false;

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => () => cleanup(), []);

  const goBack = () => navigate(createPageUrl('SharedSpace'));
  const handleStartVideoCall = () => startVideoCallInvite({ chatId, receiverId: resolvedOtherUserId, socketService, navigate, toast });

  const handleJoinIncomingCall = () => {
    if (!incomingCall) return;
    clearIncomingCall?.();
    navigate(buildVideoCallUrl(incomingCall.chatId, incomingCall.callerId));
  };
  const loadingSkeleton = <div className="min-h-screen bg-background p-4"><ChatSkeleton count={6} /></div>;

  if (isLoading) return loadingSkeleton;
  if (chatId && !isDemo && chatError) return <ErrorScreen title="Chat Not Found" description="This conversation doesn't exist or has been deleted." onBack={goBack} />;
  if (!resolvedOtherUser) {
    if (!resolvedOtherUserId && !chat) return <ErrorScreen title="Unable to Load Chat" description="Could not find the user for this conversation." onBack={goBack} />;
    return loadingSkeleton;
  }

  const isTemporary = !!(chat?.is_temporary && !chat?.is_permanent);
  const isPermanent = !isTemporary;
  const expiresAt = chat?.expires_at ? new Date(chat.expires_at) : null;
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - new Date()) / 1000 / 60 / 60)) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="ltr">
      <PrivateChatHeader
        otherUser={resolvedOtherUser} otherUserId={resolvedOtherUserId} chatId={chatId}
        isTemporary={isTemporary} isPermanent={isPermanent} timeLeft={timeLeft}
        isOtherUserOnline={isOtherUserOnline} isOtherUserTyping={isOtherUserTyping}
        showActions={showActions} onToggleActions={() => setShowActions(!showActions)}
        onNavigate={navigate} onStartVideoCall={handleStartVideoCall} onBlockUser={() => handleBlockUser(resolvedOtherUserId)}
      />
      <MessageList ref={messagesEndRef} messages={messages} currentUserId={currentUser.id} isOtherUserTyping={isOtherUserTyping} otherUserNickname={resolvedOtherUser?.nickname} />
      <ChatInput
        message={message} onMessageChange={handleTyping} onSend={handleSendMessage}
        showIceBreakers={showIceBreakers} onToggleIceBreakers={() => setShowIceBreakers(!showIceBreakers)}
        iceBreakers={ICE_BREAKERS} showIceBreakerPanel={showIceBreakers && messages.length === 0}
        onSelectIceBreaker={(text) => { handleTyping(text); setShowIceBreakers(false); }}
        onSendImage={handleSendImage} onSendVoice={handleSendVoice} onSendDrawing={handleSendDrawing} isUploading={isUploading}
      />
      <IncomingVideoCallDialog
        incomingCall={incomingCall}
        fallbackName={resolvedOtherUser?.nickname}
        onDecline={() => clearIncomingCall?.()}
        onJoin={handleJoinIncomingCall}
      />
    </div>
  );
}
