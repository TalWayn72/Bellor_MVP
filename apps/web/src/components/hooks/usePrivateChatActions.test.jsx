import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePrivateChatActions } from './usePrivateChatActions';

const mockSendMessage = vi.fn();
const mockUploadFile = vi.fn();
const mockIsConnected = vi.fn();

vi.mock('@/api', () => ({
  chatService: { sendMessage: (...args) => mockSendMessage(...args) },
  userService: { blockUser: vi.fn() },
  uploadService: { uploadFile: (...args) => mockUploadFile(...args) },
  socketService: { isConnected: () => mockIsConnected() },
}));

function renderActions(overrides = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const props = {
    chatId: 'chat-123',
    currentUser: { id: 'user-1' },
    isDemo: false,
    isJoined: true,
    sendSocketMessage: vi.fn().mockResolvedValue({ success: true, data: { id: 'msg-1' } }),
    sendTyping: vi.fn(),
    scrollToBottom: vi.fn(),
    toast: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  };
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { ...renderHook(() => usePrivateChatActions(props), { wrapper }), props };
}

describe('[P1][chat] usePrivateChatActions drawing messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadFile.mockResolvedValue({ url: 'https://example.com/drawing.png' });
    mockIsConnected.mockReturnValue(true);
  });

  it('blocks drawing send before conversion or upload when socket path is unavailable', async () => {
    mockIsConnected.mockReturnValue(false);
    const createFile = vi.fn();
    const { result, props } = renderActions({ isJoined: false });

    await act(async () => {
      await result.current.handleSendDrawing(createFile);
    });

    expect(createFile).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(props.sendSocketMessage).not.toHaveBeenCalled();
    expect(props.toast).toHaveBeenCalledWith({
      title: 'Drawing unavailable',
      description: 'Drawing messages require an active chat connection.',
      variant: 'destructive',
    });
  });

  it('uploads a PNG drawing and sends it as DRAWING over the socket path', async () => {
    const file = new File(['png'], 'chat-drawing.png', { type: 'image/png' });
    const { result, props } = renderActions();

    await act(async () => {
      await result.current.handleSendDrawing(() => Promise.resolve(file));
    });

    expect(mockUploadFile).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(props.sendSocketMessage).toHaveBeenCalledWith(
        'https://example.com/drawing.png',
        { messageType: 'DRAWING' }
      );
    });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
