import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MessageInput({ inputMessage, onInputChange, onSend }) {
  return (
    <div className="bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
          className="flex-1"
          inputSize="default"
        />
        <Button
          onClick={onSend}
          disabled={!inputMessage.trim()}
          size="icon"
          className="rounded-full"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
