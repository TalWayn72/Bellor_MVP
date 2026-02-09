import React, { useState, useEffect, useRef } from 'react';
import { ChatSkeleton } from '@/components/states';
import { useCurrentUser } from '@/components/hooks/useCurrentUser';
import LiveChatHeader from './LiveChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

export default function LiveChat() {
  const { currentUser, isLoading } = useCurrentUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const supportResponseTimerRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setMessages([
        {
          id: 1,
          sender: 'support',
          text: `Hi ${currentUser.full_name || currentUser.nickname}! How can we help you today?`,
          time: new Date()
        }
      ]);
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (supportResponseTimerRef.current) {
        clearTimeout(supportResponseTimerRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      time: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');

    if (supportResponseTimerRef.current) {
      clearTimeout(supportResponseTimerRef.current);
    }
    supportResponseTimerRef.current = setTimeout(() => {
      const supportMessage = {
        id: messages.length + 2,
        sender: 'support',
        text: 'Thank you for your message. A support team member will respond shortly. Our average response time is under 5 minutes.',
        time: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1000);
  };

  if (isLoading || !currentUser) {
    return <ChatSkeleton count={6} />;
  }

  return (
    <div className="h-screen bg-background flex flex-col" dir="ltr">
      <LiveChatHeader />
      <MessageList messages={messages} messagesEndRef={messagesEndRef} onQuickReplySelect={setInputMessage} />
      <MessageInput inputMessage={inputMessage} onInputChange={setInputMessage} onSend={handleSend} />
    </div>
  );
}
