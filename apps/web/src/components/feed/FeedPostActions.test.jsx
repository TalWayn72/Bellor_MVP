import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedPostActions from './FeedPostActions';

vi.mock('@/api', () => ({
  likeService: { likeUser: vi.fn() },
}));

const TEMP_CHAT_LABEL = "\u05E6'\u05D0\u05D8 \u05D6\u05DE\u05E0\u05D9 \u05DC-24 \u05E9\u05E2\u05D5\u05EA";
const TEMP_CHAT_SENT_LABEL = '\u2713 \u05D1\u05E7\u05E9\u05D4 \u05D6\u05DE\u05E0\u05D9\u05EA \u05E0\u05E9\u05DC\u05D7\u05D4';

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

    expect(screen.getByText(TEMP_CHAT_LABEL)).toBeInTheDocument();
  });

  it('shows the temporary request sent label', () => {
    render(<FeedPostActions {...baseProps} chatRequestSent />);

    expect(screen.getByText(TEMP_CHAT_SENT_LABEL)).toBeInTheDocument();
  });

  it('opens the temporary chat request dialog without marking the request as sent', () => {
    const onChatRequest = vi.fn();
    const setChatRequestSent = vi.fn();

    render(
      <FeedPostActions
        {...baseProps}
        onChatRequest={onChatRequest}
        setChatRequestSent={setChatRequestSent}
      />
    );

    fireEvent.click(screen.getByText(TEMP_CHAT_LABEL));

    expect(onChatRequest).toHaveBeenCalledWith({ nickname: 'User', id: 'user-2' });
    expect(setChatRequestSent).not.toHaveBeenCalled();
    expect(screen.getByText(TEMP_CHAT_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(TEMP_CHAT_SENT_LABEL)).not.toBeInTheDocument();
  });
});
