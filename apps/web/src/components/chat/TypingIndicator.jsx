import React from 'react';

/**
 * Typing Indicator Component
 * Shows animated dots when a user is typing
 *
 * @param {Object} props
 * @param {boolean} props.isTyping - Whether the user is typing
 * @param {string} props.userName - Name of the user who is typing (optional)
 */
export default function TypingIndicator({ isTyping, userName }) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground text-sm">
      <div className="flex gap-1">
        <div
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
      <span>{userName ? `${userName} is typing...` : 'typing...'}</span>
    </div>
  );
}
