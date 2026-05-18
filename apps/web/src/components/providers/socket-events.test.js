import { describe, expect, it, vi } from 'vitest';
import { createSocketEventHandlers } from './socket-events';

describe('socket event unread count handling', () => {
  it('does not change reader unread count from sender-side read receipts', () => {
    const setUnreadChatCount = vi.fn();
    const handlers = createSocketEventHandlers(vi.fn(), vi.fn(), setUnreadChatCount);

    handlers.handleMessageRead();

    expect(setUnreadChatCount).not.toHaveBeenCalled();
  });
});
