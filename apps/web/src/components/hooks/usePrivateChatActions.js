import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatService, userService, socketService, uploadService } from '@/api';
import { createPageUrl } from '@/utils';

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
      if (isJoined && socketService.isConnected()) {
        const r = await sendSocketMessage(data.content, { messageType: data.type || 'TEXT' });
        if (r.success) return r.data;
      }
      return await chatService.sendMessage(chatId, data);
    },
    onSuccess: () => { setMessage(''); setIsTyping(false); sendTyping(false); scrollToBottom(); },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !chatId || !currentUser) return;
    if (isDemo) { addLocalMessage(message, 'TEXT'); return; }
    sendMessageMutation.mutate({ content: message, type: 'TEXT' });
  };

  const handleSendImage = async (file) => {
    if (!chatId || !currentUser) return;
    if (isDemo) { addLocalMessage(URL.createObjectURL(file), 'IMAGE'); return; }
    setIsUploading(true);
    try {
      const { url } = await uploadService.uploadFile(file);
      sendMessageMutation.mutate({ content: url, type: 'IMAGE' });
    } catch { toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' }); }
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

  const handleBlockUser = async (otherUserId) => {
    if (!confirm('Are you sure you want to block this user?')) return;
    try { await userService.blockUser(otherUserId); toast({ title: 'Success', description: 'User blocked successfully' }); navigate(createPageUrl('SharedSpace')); }
    catch { toast({ title: 'Error', description: 'Error blocking user', variant: 'destructive' }); }
  };

  const cleanup = () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };

  return { message, isUploading, localMessages, handleTyping, handleSendMessage, handleSendImage, handleSendVoice, handleBlockUser, cleanup };
}
