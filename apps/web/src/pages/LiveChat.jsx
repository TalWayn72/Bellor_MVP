import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChatSkeleton } from '@/components/states';
import { createPageUrl } from '@/utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function LiveChat() {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useCurrentUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      // Initial greeting
      setMessages([
        {
          id: 1,
          sender: 'support',
          text: `Hi ${currentUser.full_name || currentUser.nickname}! 👋 How can we help you today?`,
          time: new Date()
        }
      ]);
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Simulate support response
    setTimeout(() => {
      const supportMessage = {
        id: messages.length + 2,
        sender: 'support',
        text: 'Thank you for your message. A support team member will respond shortly. Our average response time is under 5 minutes.',
        time: new Date()
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1000);
  };

  const quickReplies = [
    'Issue with matching',
    'Payment problem',
    'Account verification',
    'Report a bug'
  ];

  if (isLoading || !currentUser) {
    return <ChatSkeleton count={6} />;
  }

  return (
    <div className="h-screen bg-background flex flex-col" dir="ltr">
      <header className="bg-card sticky top-0 z-10 shadow-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <BackButton variant="header" position="relative" fallback="/HelpSupport" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-foreground">Live Support</h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
          <div className="min-w-[24px]"></div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <span className={`text-xs mt-1 block ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {message.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length === 1 && (
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <p className="text-xs text-muted-foreground mb-3 text-center">Quick questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.map((reply, idx) => (
                <Card
                  key={idx}
                  variant="interactive"
                  onClick={() => setInputMessage(reply)}
                  className="cursor-pointer"
                >
                  <div className="px-4 py-3 text-sm text-foreground">
                    {reply}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
            inputSize="default"
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
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