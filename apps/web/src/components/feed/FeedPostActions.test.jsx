import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedPostActions from './FeedPostActions';

vi.mock('@/api', () => ({
  likeService: { likeUser: vi.fn() },
}));

const baseProps = {
  response: { id: 'response-1', user_id: 'user-2' },
  currentUser: { id: 'user-1' },
  userData: { nickname: 'User' },
  heartSent: false,
  starSent: false,
  setStarSent: vi.fn(),
  chatRequestSent: false,
  setChatRequestSent: vi.fn(),
  hasNewComments: false,
  hasNewStars: false,
  onOpenHeartSelector: vi.fn(),
  onOpenComments: vi.fn(),
  onOpenCommentInput: vi.fn(),
  onOpenStarSenders: vi.fn(),
  onChatRequest: vi.fn(),
};

describe('FeedPostActions', () => {
  it('shows the 24 hour temporary chat action label', () => {
    render(<FeedPostActions {...baseProps} />);

    expect(screen.getByText("צ'אט זמני ל-24 שעות")).toBeInTheDocument();
  });

  it('shows the temporary request sent label', () => {
    render(<FeedPostActions {...baseProps} chatRequestSent />);

    expect(screen.getByText('✓ בקשה זמנית נשלחה')).toBeInTheDocument();
  });
});
