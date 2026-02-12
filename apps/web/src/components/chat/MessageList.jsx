import React from 'react';
import { MessageCircle, Mic } from 'lucide-react';
import TypingIndicator from '@/components/chat/TypingIndicator';

function MessageContent({ msg }) {
  const type = (msg.message_type || msg.messageType || 'TEXT').toUpperCase();
  if (type === 'IMAGE') {
    return (
      <a href={msg.content} target="_blank" rel="noopener noreferrer">
        <img src={msg.content} alt="Shared image" className="max-w-full rounded-lg max-h-60 object-cover" />
      </a>
    );
  }
  if (type === 'VOICE') {
    return (
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 shrink-0" />
        <audio src={msg.content} controls className="max-w-[200px] h-8" />
      </div>
    );
  }
  return <p className="text-sm leading-relaxed">{msg.content}</p>;
}

function formatDateLabel(date) {
  const today = new Date(), yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(date);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DateSeparator({ date }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">{formatDateLabel(date)}</span>
    </div>
  );
}

const MessageList = React.forwardRef(function MessageList({ messages, currentUserId, isOtherUserTyping, otherUserNickname }, ref) {
  let lastDate = null;
  return (
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
          const msgDate = new Date(msg.created_date || msg.createdAt);
          const dateStr = msgDate.toDateString();
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          const isMe = msg.sender_id === currentUserId;
          return (
            <React.Fragment key={msg.id}>
              {showDate && <DateSeparator date={msgDate} />}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  <MessageContent msg={msg} />
                  <span className={`text-xs mt-1 block ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {msgDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {isOtherUserTyping && <TypingIndicator isTyping={true} userName={otherUserNickname} />}
        <div ref={ref} />
      </div>
    </div>
  );
});

export default MessageList;
