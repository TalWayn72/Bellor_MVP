import React from 'react';
import { Send, Image as ImageIcon, Mic, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatInput({
  message,
  onMessageChange,
  onSend,
  showIceBreakers,
  onToggleIceBreakers,
  iceBreakers,
  showIceBreakerPanel,
  onSelectIceBreaker,
}) {
  return (
    <>
      {showIceBreakerPanel && (
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Ice Breakers</h3>
            <div className="space-y-2">
              {iceBreakers.slice(0, 3).map((breaker, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectIceBreaker(breaker.text)}
                  className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-xl text-sm transition-colors text-foreground"
                >
                  {breaker.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border-t border-border p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleIceBreakers}
            aria-label="Toggle ice breakers"
            className={showIceBreakers ? 'text-primary' : ''}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Send image">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Record voice message">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            className="flex-1"
            inputSize="default"
          />
          <Button
            onClick={onSend}
            disabled={!message.trim()}
            size="icon"
            aria-label="Send message"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
