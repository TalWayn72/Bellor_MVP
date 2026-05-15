import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatService, userService, socketService, uploadService } from '@/api';
import { createPageUrl } from '@/utils';

function getMediaMessageType(file) {
  if (file.type?.startsWith('video/')) return 'VIDEO';
  if (file.type?.startsWith('image/')) return 'IMAGE';
  return null;
}

export function usePrivateChatActions({ chatId, currentUser, isDemo, isJoined, sendSocketMessage, sendTyping, scrollToBottom, toast, navigate }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const typingTimeoutRef = useRef(null);

  const addLocalMessage = useCallback((content, type = 'TEXT') => {
    setLocalMessages(prev => [...prev, {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sender_id: currentUser?.id, content, message_type: type, created_date: new Date().toISOString(),
    }]);
    setMessage('');
    setTimeout(scrollToBottom, 50);
  }, [currentUser, scrollToBottom]);

  const handleTyping = useCallback((value) => {
    setMessage(value);
    if (isDemo) return;
    try {
      if (!isTyping) { setIsTyping(true); sendTyping(true); }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); sendTyping(false); }, 2000);
    } catch { /* socket not connected */ }
  }, [isDemo, isTyping, sendTyping]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const requiresSocket = data.type === 'DRAWING';
      // Try WebSocket first if connected
      if (isJoined && socketService.isConnected()) {
        try {
          const r = await sendSocketMessage(data.content, { messageType: data.type || 'TEXT' });
          if (r && r.success) return r.data;
        } catch { /* handled below */ }
      }
      if (requiresSocket) {
        throw new Error('Drawing messages require an active chat connection.');
      }
      // Fallback to HTTP API
      const result = await chatService.sendMessage(chatId, data);
      return result.message;
    },
    onSuccess: () => {
      setMessage('');
      setIsTyping(false);
      sendTyping(false);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleSendMessage = () => {
    if (!message.trim() || !chatId || !currentUser) return;
    if (isDemo) { addLocalMessage(message, 'TEXT'); return; }
    sendMessageMutation.mutate({ content: message, type: 'TEXT' });
  };

  const handleSendImage = async (file) => {
    if (!chatId || !currentUser) return;
    const messageType = getMediaMessageType(file);
    if (!messageType) {
      toast({
        title: 'Error',
        description: 'Unsupported media type. Please choose an image or supported video file.',
        variant: 'destructive'
      });
      return;
    }
    if (isDemo) { addLocalMessage(URL.createObjectURL(file), messageType); return; }
    setIsUploading(true);
    try {
      const { url } = await uploadService.uploadFile(file);
      sendMessageMutation.mutate({ content: url, type: messageType });
    } catch { toast({ title: 'Error', description: 'Failed to upload media', variant: 'destructive' }); }
    finally { setIsUploading(false); }
  };

  const handleSendVoice = async (blob) => {
    if (!chatId || !currentUser) return;
    if (isDemo) { addLocalMessage(URL.createObjectURL(blob), 'VOICE'); return; }
    setIsUploading(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const { url } = await uploadService.uploadAudio(file);
      sendMessageMutation.mutate({ content: url, type: 'VOICE' });
    } catch { toast({ title: 'Error', description: 'Failed to upload voice message', variant: 'destructive' }); }
    finally { setIsUploading(false); }
  };

  const handleSendDrawing = async (createFile) => {
    if (!chatId || !currentUser) return false;
    if (!isJoined || !socketService.isConnected()) {
      toast({
        title: 'Drawing unavailable',
        description: 'Drawing messages require an active chat connection.',
        variant: 'destructive'
      });
      return false;
    }
    setIsUploading(true);
    try {
      const file = await createFile();
      const { url } = await uploadService.uploadFile(file);
      await sendMessageMutation.mutateAsync({ content: url, type: 'DRAWING' });
      return true;
    } catch {
      toast({ title: 'Error', description: 'Failed to upload drawing', variant: 'destructive' });
      return false;
    } finally { setIsUploading(false); }
  };

  const handleBlockUser = async (otherUserId) => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try { await userService.blockUser(otherUserId); toast({ title: 'Success', description: 'User blocked successfully' }); navigate(createPageUrl('SharedSpace')); }
    catch { toast({ title: 'Error', description: 'Error blocking user', variant: 'destructive' }); }
  };

  const cleanup = () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };

  return { message, isUploading, localMessages, handleTyping, handleSendMessage, handleSendImage, handleSendVoice, handleSendDrawing, handleBlockUser, cleanup };
}
