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
    mockSendMessage.mockResolvedValue({ message: { id: 'rest-msg-1' } });
    mockIsConnected.mockReturnValue(true);
  });

  it('uploads a PNG drawing and sends it through REST fallback when socket path is unavailable', async () => {
    mockIsConnected.mockReturnValue(false);
    const file = new File(['png'], 'chat-drawing.png', { type: 'image/png' });
    const createFile = vi.fn().mockResolvedValue(file);
    const { result, props } = renderActions({ isJoined: false });

    await act(async () => {
      await result.current.handleSendDrawing(createFile);
    });

    expect(createFile).toHaveBeenCalled();
    expect(mockUploadFile).toHaveBeenCalledWith(file);
    expect(props.sendSocketMessage).not.toHaveBeenCalled();
    expect(mockSendMessage).toHaveBeenCalledWith('chat-123', {
      content: 'https://example.com/drawing.png',
      type: 'DRAWING',
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
