import { useEffect, useRef, useState } from 'react';
import { isDemoId } from '@/data/demoData';
import { isDocumentActive } from '@/utils/documentActivity';
import { useSocketContext } from '@/components/providers/SocketProvider';

const getSenderId = (message) => message?.sender_id || message?.senderId;
const getIsRead = (message) => message?.is_read ?? message?.isRead;

function useDocumentActivityVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((current) => current + 1);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('focus', bump);
    return () => {
      document.removeEventListener('visibilitychange', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);

  return version;
}

export function usePrivateChatReadReceipts({ chatId, currentUserId, isDemo, messages, markAsRead }) {
  const attemptedRef = useRef(new Set());
  const activityVersion = useDocumentActivityVersion();
  const { refreshUnreadCount } = useSocketContext();

  useEffect(() => {
    if (!chatId || !currentUserId || typeof markAsRead !== 'function' || isDemo || isDemoId(chatId) || !isDocumentActive()) return;
    const unreadIncoming = messages.filter((message) => (
      message?.id &&
      getSenderId(message) !== currentUserId &&
      getIsRead(message) === false &&
      !attemptedRef.current.has(message.id)
    ));
    if (unreadIncoming.length === 0) return;

    let cancelled = false;
    unreadIncoming.forEach((message) => attemptedRef.current.add(message.id));
    Promise.allSettled(unreadIncoming.map((message) => markAsRead(message.id)))
      .then((results) => {
        if (!cancelled && results.some((result) => result.status === 'fulfilled' && result.value?.success !== false)) {
          refreshUnreadCount?.();
        }
      });

    return () => { cancelled = true; };
  }, [activityVersion, chatId, currentUserId, isDemo, markAsRead, messages, refreshUnreadCount]);
}
