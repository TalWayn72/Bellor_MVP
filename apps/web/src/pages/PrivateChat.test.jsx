import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  chatService: { getChatById: vi.fn().mockResolvedValue({ chat: null }), getMessages: vi.fn().mockResolvedValue({ messages: [] }), sendMessage: vi.fn() },
  userService: { getUserById: vi.fn().mockResolvedValue({ user: null }), blockUser: vi.fn() },
  socketService: { on: vi.fn(() => vi.fn()), isConnected: vi.fn(() => false) },
}));

vi.mock('@/api/hooks/useSocket', () => ({
  useChatRoom: vi.fn(() => ({ messages: [], typingUsers: {}, isJoined: false, sendMessage: vi.fn(), sendTyping: vi.fn() })),
  usePresence: vi.fn(() => ({ isOnline: vi.fn(() => false) })),
}));

vi.mock('@/components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/chat/PrivateChatHeader', () => ({
  default: () => <div data-testid="chat-header">Header</div>,
}));

vi.mock('@/components/chat/MessageList', () => ({
  default: React.forwardRef((props, ref) => <div data-testid="message-list" ref={ref}>Messages</div>),
}));

vi.mock('@/components/chat/ChatInput', () => ({
  default: () => <div data-testid="chat-input">Input</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import React from 'react';
import PrivateChat from './PrivateChat';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PrivateChat', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<PrivateChat />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('shows error state when no chat params', () => {
    const { container } = render(<PrivateChat />, { wrapper: createWrapper() });
    // Without chatId/userId, shows "Unable to Load Chat"
    expect(container.textContent).toContain('Unable to Load Chat');
  });
});
