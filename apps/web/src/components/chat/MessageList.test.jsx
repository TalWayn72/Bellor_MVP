import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from './MessageList';

describe('[P1][chat] MessageList', () => {
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
});
