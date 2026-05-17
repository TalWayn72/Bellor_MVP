import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useChatRoom } from './useChatRoom';
import { socketService } from '../services/socketService';

const listeners = new Map();
const unsubs = new Map();

vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(() => Promise.resolve()),
    joinChat: vi.fn(() => Promise.resolve({ success: true })),
    leaveChat: vi.fn(),
    on: vi.fn((event, callback) => {
      listeners.set(event, callback);
      const unsub = vi.fn();
      unsubs.set(event, unsub);
      return unsub;
    }),
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    markMessageRead: vi.fn(),
    deleteMessage: vi.fn(),
  },
}));

describe('useChatRoom video call events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    unsubs.clear();
  });

  it('stores incoming calls only for the active chat from another user', async () => {
    const { result } = renderHook(() => useChatRoom('chat-1', 'user-1'));

    await waitFor(() => {
      expect(socketService.joinChat).toHaveBeenCalledWith('chat-1');
    });

    act(() => {
      listeners.get('video-call:incoming')({
        chatId: 'other-chat',
        callerId: 'user-2',
        receiverId: 'user-1',
      });
    });
    expect(result.current.incomingCall).toBeNull();

    act(() => {
      listeners.get('video-call:incoming')({
        chatId: 'chat-1',
        callerId: 'user-1',
        receiverId: 'user-2',
      });
    });
    expect(result.current.incomingCall).toBeNull();

    act(() => {
      listeners.get('video-call:incoming')({
        chatId: 'chat-1',
        callerId: 'user-2',
        receiverId: 'user-1',
      });
    });
    expect(result.current.incomingCall).toEqual({
      chatId: 'chat-1',
      callerId: 'user-2',
      receiverId: 'user-1',
    });
  });

  it('cleans up the incoming call listener on unmount', async () => {
    const { unmount } = renderHook(() => useChatRoom('chat-1', 'user-1'));

    await waitFor(() => {
      expect(socketService.joinChat).toHaveBeenCalledWith('chat-1');
    });

    unmount();

    expect(unsubs.get('video-call:incoming')).toHaveBeenCalledTimes(1);
    expect(socketService.leaveChat).toHaveBeenCalledWith('chat-1');
  });
});
