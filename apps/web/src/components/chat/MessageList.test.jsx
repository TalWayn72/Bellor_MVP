import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from './MessageList';

describe('[P1][chat] MessageList', () => {
  it('treats socket messages with senderId as current user messages', () => {
    const { container } = render(
      <MessageList
        messages={[
          {
            id: 'msg-socket-me',
            senderId: 'user-1',
            messageType: 'TEXT',
            content: 'Socket hello',
            created_at: '2026-05-14T10:00:00Z',
          },
        ]}
        currentUserId="user-1"
        isOtherUserTyping={false}
        otherUserNickname="Dana"
      />
    );

    const ownMessageRow = container.querySelector('.justify-end');
    expect(ownMessageRow).toHaveTextContent('Socket hello');
  });

  it('formats messages that only have created_at timestamps', () => {
    render(
      <MessageList
        messages={[
          {
            id: 'msg-created-at',
            sender_id: 'user-2',
            message_type: 'TEXT',
            content: 'Created at hello',
            created_at: '2026-05-14T10:00:00Z',
          },
        ]}
        currentUserId="user-1"
        isOtherUserTyping={false}
        otherUserNickname="Dana"
      />
    );

    expect(screen.getByText('Created at hello')).toBeInTheDocument();
    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument();
  });

  it('renders VIDEO messages as playable video elements', () => {
    render(
      <MessageList
        messages={[
          {
            id: 'msg-video',
            sender_id: 'user-1',
            message_type: 'VIDEO',
            content: 'https://example.com/chat-video.mp4',
            created_date: '2026-05-14T10:00:00Z',
          },
        ]}
        currentUserId="user-1"
        isOtherUserTyping={false}
        otherUserNickname="Dana"
      />
    );

    const video = screen.getByTitle('Shared video');
    expect(video).toHaveAttribute('src', 'https://example.com/chat-video.mp4');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('renders DRAWING messages as linked image media', () => {
    render(
      <MessageList
        messages={[
          {
            id: 'msg-drawing',
            sender_id: 'user-1',
            message_type: 'DRAWING',
            content: 'https://example.com/chat-drawing.png',
            created_date: '2026-05-14T10:00:00Z',
          },
        ]}
        currentUserId="user-1"
        isOtherUserTyping={false}
        otherUserNickname="Dana"
      />
    );

    const image = screen.getByAltText('Shared drawing');
    expect(image).toHaveAttribute('src', 'https://example.com/chat-drawing.png');
    expect(image).toHaveAttribute('title', 'Shared drawing');
    expect(screen.queryByText('https://example.com/chat-drawing.png')).not.toBeInTheDocument();
  });
});
