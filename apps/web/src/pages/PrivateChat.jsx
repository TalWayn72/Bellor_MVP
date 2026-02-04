import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { chatService, userService, socketService } from '@/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatRoom, usePresence } from '@/api/hooks/useSocket';
import { Send, Image as ImageIcon, Mic, MoreVertical, Video, MessageCircle } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function PrivateChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { currentUser, isLoading } = useCurrentUser();
  const [message, setMessage] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Get chat ID from URL params
  const chatId = new URLSearchParams(location.search).get('chatId') || new URLSearchParams(location.search).get('id');
  const otherUserId = new URLSearchParams(location.search).get('userId');

  // WebSocket chat room hook
  const {
    messages: realtimeMessages,
    typingUsers,
    isJoined,
    sendMessage: sendSocketMessage,
    sendTyping,
    markAsRead,
  } = useChatRoom(chatId);

  // Fetch chat details
  const { data: chat } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const result = await chatService.getChatById(chatId);
      return result.chat;
    },
    enabled: !!chatId,
  });

  // Fetch initial messages (no polling - using WebSocket now)
  const { data: initialMessages = [] } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const result = await chatService.getMessages(chatId, { limit: 100 });
      return result.messages || [];
    },
    enabled: !!chatId,
  });

  // Combine initial messages with realtime messages
  const messages = React.useMemo(() => {
    const allMessages = [...initialMessages];
    // Add realtime messages that aren't already in the list
    realtimeMessages.forEach((msg) => {
      if (!allMessages.some((m) => m.id === msg.id)) {
        allMessages.push(msg);
      }
    });
    // Sort by creation date
    return allMessages.sort((a, b) =>
      new Date(a.created_date || a.createdAt) - new Date(b.created_date || b.createdAt)
    );
  }, [initialMessages, realtimeMessages]);

  // Fetch other user details
  const { data: otherUser } = useQuery({
    queryKey: ['user', otherUserId, chat?.user1_id, chat?.user2_id],
    queryFn: async () => {
      let targetUserId = otherUserId;

      if (!targetUserId && chat && currentUser) {
        targetUserId = chat.user1_id === currentUser.id ? chat.user2_id : chat.user1_id;
      }

      if (!targetUserId) return null;

      try {
        const result = await userService.getUserById(targetUserId);
        return result.user;
      } catch (error) {
        return {
          id: targetUserId,
          nickname: 'User',
          age: null,
          profile_images: [`https://i.pravatar.cc/150?u=${targetUserId}`]
        };
      }
    },
    enabled: !!otherUserId || (!!chat && !!currentUser),
  });

  // Track online status of other user
  const otherUserIdForPresence = otherUser?.id || otherUserId;
  const { isOnline } = usePresence(otherUserIdForPresence ? [otherUserIdForPresence] : []);
  const isOtherUserOnline = otherUserIdForPresence ? isOnline(otherUserIdForPresence) : false;

  // Check if other user is typing
  const isOtherUserTyping = otherUserIdForPresence ? typingUsers[otherUserIdForPresence] : false;

  // Ice breakers - using demo data
  const iceBreakers = [
    { text: "What's your favorite way to spend a weekend?", category: "casual" },
    { text: "If you could have dinner with anyone, who would it be?", category: "fun" },
    { text: "What's something you're passionate about?", category: "deep" },
    { text: "What's your most memorable travel experience?", category: "casual" },
    { text: "Do you prefer coffee or tea?", category: "casual" }
  ];

  // Handle typing indicator
  const handleTyping = useCallback((value) => {
    setMessage(value);

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 2000);
  }, [isTyping, sendTyping]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      // Try WebSocket first, fallback to REST
      if (isJoined && socketService.isConnected()) {
        const response = await sendSocketMessage(messageData.content);
        if (response.success) {
          return response.data;
        }
      }
      // Fallback to REST API
      return await chatService.sendMessage(chatId, messageData);
    },
    onSuccess: () => {
      setMessage('');
      setIsTyping(false);
      sendTyping(false);
      scrollToBottom();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !chatId || !currentUser) return;

    sendMessageMutation.mutate({
      content: message,
      type: 'text',
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBlockUser = async () => {
    if (!confirm('Are you sure you want to block this user?')) return;

    try {
      await userService.blockUser(otherUserId);
      alert('User blocked successfully');
      navigate(createPageUrl('SharedSpace'));
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Error blocking user');
    }
  };

  if (isLoading || !otherUser) {
    return <ChatSkeleton count={6} />;
  }

  const isTemporary = chat?.is_temporary && !chat?.is_permanent;
  const expiresAt = chat?.expires_at ? new Date(chat.expires_at) : null;
  const timeLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - new Date()) / 1000 / 60 / 60)) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="ltr">
      {/* Header */}
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton variant="header" position="relative" fallback="/SharedSpace" />
            <div className="relative">
              <Avatar size="md">
                <AvatarImage
                  src={otherUser?.profile_images?.[0] || `https://i.pravatar.cc/150?u=${otherUser?.id}`}
                  alt={otherUser?.nickname}
                />
                <AvatarFallback>{otherUser?.nickname?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <AvatarStatus status="online" size="md" />
            </div>
            <div>
              <h1 className="font-semibold text-base text-foreground">{otherUser.nickname}</h1>
              {isTemporary && timeLeft !== null ? (
                <Badge variant="warning" size="sm">
                  ⏰ {timeLeft}h left
                </Badge>
              ) : isOtherUserTyping ? (
                <span className="text-xs text-primary animate-pulse">typing...</span>
              ) : (
                <span className={`text-xs ${isOtherUserOnline ? 'text-success' : 'text-muted-foreground'}`}>
                  {isOtherUserOnline ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl(`VideoDate?chatId=${chatId}`))}
            >
              <Video className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setShowActions(!showActions)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
              {showActions && (
                <Card className="absolute right-0 top-full mt-2 py-1 w-48 z-20 shadow-lg border border-border">
                  <button
                    onClick={() => navigate(createPageUrl(`UserProfile?id=${otherUserId}`))}
                    className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Block User
                  </button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <span className={`text-xs mt-1 block ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isOtherUserTyping && (
            <TypingIndicator isTyping={true} userName={otherUser?.nickname} />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Ice Breakers */}
      {showIceBreakers && messages.length === 0 && (
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Ice Breakers</h3>
            <div className="space-y-2">
              {iceBreakers.slice(0, 3).map((breaker, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setMessage(breaker.text);
                    setShowIceBreakers(false);
                  }}
                  className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-xl text-sm transition-colors text-foreground"
                >
                  {breaker.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowIceBreakers(!showIceBreakers)}
            className={showIceBreakers ? 'text-primary' : ''}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            inputSize="default"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
