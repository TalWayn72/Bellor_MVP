import React from 'react';
import { Card } from '@/components/ui/card';

function MessageBubble({ message }) {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
}

function QuickReplies({ quickReplies, onSelect }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-4">
      <p className="text-xs text-muted-foreground mb-3 text-center">Quick questions:</p>
      <div className="grid grid-cols-2 gap-2">
        {quickReplies.map((reply, idx) => (
          <Card
            key={idx}
            variant="interactive"
            onClick={() => onSelect(reply)}
            className="cursor-pointer"
          >
            <div className="px-4 py-3 text-sm text-foreground">
              {reply}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const QUICK_REPLIES = [
  'Issue with matching',
  'Payment problem',
  'Account verification',
  'Report a bug'
];

export default function MessageList({ messages, messagesEndRef, onQuickReplySelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <QuickReplies quickReplies={QUICK_REPLIES} onSelect={onQuickReplySelect} />
      )}
    </div>
  );
}
