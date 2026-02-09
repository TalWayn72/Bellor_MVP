/**
 * useChatRoom Hook
 * Manages joining/leaving chat rooms and receiving messages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';

export function useChatRoom(chatId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const typingTimeoutRef = useRef({});

  // Join chat room
  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;

    setLoading(true);
    socketService.connect()
      .then(() => socketService.joinChat(chatId))
      .then((response) => {
        if (isMounted && response.success) {
          setIsJoined(true);
        }
      })
      .catch(console.error)
      .finally(() => { if (isMounted) setLoading(false); });

    // Cleanup: leave chat room
    return () => {
      isMounted = false;
      socketService.leaveChat(chatId);
      setIsJoined(false);
      setMessages([]);
      setTypingUsers({});
    };
  }, [chatId]);

  // Listen for new messages
  useEffect(() => {
    if (!chatId) return;

    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data.message]);
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const handleTyping = (data) => {
      if (data.chatId !== chatId) return;

      setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
        }
        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => ({ ...prev, [data.userId]: false }));
        }, 3000);
      }
    };

    const unsubMessage = socketService.on('chat:message:new', handleNewMessage);
    const unsubDeleted = socketService.on('chat:message:deleted', handleMessageDeleted);
    const unsubTyping = socketService.on('chat:typing', handleTyping);

    return () => {
      unsubMessage();
      unsubDeleted();
      unsubTyping();

      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [chatId]);

  const sendMessage = useCallback(async (content, metadata = {}) => {
    if (!chatId) return;
    return await socketService.sendMessage(chatId, content, metadata);
  }, [chatId]);

  const sendTyping = useCallback((isTyping) => {
    if (!chatId) return;
    socketService.sendTyping(chatId, isTyping);
  }, [chatId]);

  const markAsRead = useCallback(async (messageId) => {
    return await socketService.markMessageRead(messageId);
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    return await socketService.deleteMessage(messageId);
  }, []);

  return { messages, typingUsers, isJoined, loading, sendMessage, sendTyping, markAsRead, deleteMessage };
}
