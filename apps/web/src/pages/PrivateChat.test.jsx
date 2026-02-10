import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock scrollIntoView which is not available in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockNavigate = vi.fn();
const mockLocationSearch = vi.fn(() => '');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: mockLocationSearch(), pathname: '/PrivateChat' }),
  };
});

const mockGetChatById = vi.fn().mockResolvedValue({ chat: null });
const mockGetMessages = vi.fn().mockResolvedValue({ messages: [] });
const mockSendMessage = vi.fn().mockResolvedValue({ id: 'msg-new', content: 'Hello' });
const mockGetUserById = vi.fn().mockResolvedValue({ user: null });
const mockBlockUser = vi.fn();

vi.mock('@/api', () => ({
  chatService: {
    getChatById: (...args) => mockGetChatById(...args),
    getMessages: (...args) => mockGetMessages(...args),
    sendMessage: (...args) => mockSendMessage(...args),
  },
  userService: {
    getUserById: (...args) => mockGetUserById(...args),
    blockUser: (...args) => mockBlockUser(...args),
  },
  socketService: { on: vi.fn(() => vi.fn()), isConnected: vi.fn(() => false) },
}));

const mockSendSocketMessage = vi.fn();
const mockSendTyping = vi.fn();

vi.mock('@/api/hooks/useSocket', () => ({
  useChatRoom: vi.fn(() => ({
    messages: [],
    typingUsers: {},
    isJoined: false,
    sendMessage: mockSendSocketMessage,
    sendTyping: mockSendTyping,
  })),
  usePresence: vi.fn(() => ({ isOnline: vi.fn(() => false) })),
}));

const mockUseCurrentUser = vi.fn(() => ({
  currentUser: { id: 'user-1', nickname: 'TestUser' },
  isLoading: false,
}));

vi.mock('@/components/hooks/useCurrentUser', () => ({
  useCurrentUser: (...args) => mockUseCurrentUser(...args),
}));

// Render sub-components with realistic mock implementations
let capturedOnSend = null;
let capturedOnMessageChange = null;
let capturedMessage = '';

vi.mock('@/components/chat/PrivateChatHeader', () => ({
  default: ({ otherUser, isOtherUserOnline, isOtherUserTyping }) => (
    <div data-testid="chat-header">
      <span data-testid="header-username">{otherUser?.nickname}</span>
      {isOtherUserTyping && <span data-testid="header-typing">typing...</span>}
      {isOtherUserOnline && <span data-testid="header-online">Online</span>}
    </div>
  ),
}));

vi.mock('@/components/chat/MessageList', () => ({
  default: React.forwardRef(({ messages, currentUserId, isOtherUserTyping, otherUserNickname }, ref) => (
    <div data-testid="message-list" ref={ref}>
      {messages.length === 0 && <p data-testid="empty-messages">No messages yet</p>}
      {messages.map((msg) => (
        <div key={msg.id} data-testid="message-item" data-sender={msg.sender_id === currentUserId ? 'me' : 'other'}>
          <span data-testid="message-content">{msg.content}</span>
          <span data-testid="message-timestamp">{msg.created_date}</span>
        </div>
      ))}
      {isOtherUserTyping && <div data-testid="typing-indicator">{otherUserNickname} is typing...</div>}
    </div>
  )),
}));

vi.mock('@/components/chat/ChatInput', () => ({
  default: ({ message, onMessageChange, onSend }) => {
    capturedOnSend = onSend;
    capturedOnMessageChange = onMessageChange;
    capturedMessage = message;
    return (
      <div data-testid="chat-input">
        <input
          data-testid="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSend()}
        />
        <button data-testid="send-button" onClick={onSend} disabled={!message.trim()}>
          Send
        </button>
      </div>
    );
  },
}));

vi.mock('@/components/states', () => ({
  ChatSkeleton: ({ count }) => <div data-testid="chat-skeleton">Loading {count} messages...</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import PrivateChat from './PrivateChat';

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const createWrapper = () => {
  const qc = createTestQueryClient();
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('[P1][chat] PrivateChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSend = null;
    capturedOnMessageChange = null;
    capturedMessage = '';
    mockLocationSearch.mockReturnValue('');
    mockUseCurrentUser.mockReturnValue({
      currentUser: { id: 'user-1', nickname: 'TestUser' },
      isLoading: false,
    });
    mockGetChatById.mockResolvedValue({ chat: null });
    mockGetMessages.mockResolvedValue({ messages: [] });
    mockGetUserById.mockResolvedValue({
      user: {
        id: 'user-2',
        nickname: 'OtherUser',
        age: 26,
        profile_images: ['https://example.com/other.jpg'],
      },
    });
  });

  // --- Existing scaffold tests ---

  it('renders without crashing', () => {
    const { container } = render(<PrivateChat />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('shows error state when no chat params', () => {
    const { container } = render(<PrivateChat />, { wrapper: createWrapper() });
    expect(container.textContent).toContain('Unable to Load Chat');
  });

  // --- New behavioral tests ---

  describe('Chat with valid params', () => {
    beforeEach(() => {
      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({
        messages: [
          { id: 'msg-1', sender_id: 'user-1', content: 'Hey there!', created_date: '2025-01-15T10:00:00Z' },
          { id: 'msg-2', sender_id: 'user-2', content: 'Hello!', created_date: '2025-01-15T10:01:00Z' },
        ],
      });
    });

    it('should render the message list', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });
    });

    it('should render the chat header with other user name', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
        expect(screen.getByTestId('header-username')).toHaveTextContent('OtherUser');
      });
    });

    it('should display chat input field', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        expect(screen.getByTestId('chat-input')).toBeInTheDocument();
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });
    });

    it('should display message timestamps', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        const timestamps = screen.getAllByTestId('message-timestamp');
        expect(timestamps.length).toBeGreaterThan(0);
        expect(timestamps[0]).toHaveTextContent('2025-01-15');
      });
    });

    it('should display messages from both users', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        const messages = screen.getAllByTestId('message-item');
        expect(messages.length).toBe(2);
      });
    });

    it('should distinguish own messages from other user messages', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        const messages = screen.getAllByTestId('message-item');
        expect(messages[0]).toHaveAttribute('data-sender', 'me');
        expect(messages[1]).toHaveAttribute('data-sender', 'other');
      });
    });

    it('should display message content', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });
      await waitFor(() => {
        const contents = screen.getAllByTestId('message-content');
        expect(contents[0]).toHaveTextContent('Hey there!');
        expect(contents[1]).toHaveTextContent('Hello!');
      });
    });
  });

  describe('Sending messages', () => {
    beforeEach(() => {
      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({ messages: [] });
    });

    it('should handle sending a message via input and send button', async () => {
      const user = userEvent.setup();
      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('message-input');
      await user.type(input, 'Hello World');

      const sendButton = screen.getByTestId('send-button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });
    });

    it('should disable send button when message is empty', async () => {
      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('send-button')).toBeInTheDocument();
      });

      expect(screen.getByTestId('send-button')).toBeDisabled();
    });
  });

  describe('Typing indicator', () => {
    it('should show typing indicator when other user is typing', async () => {
      const { useChatRoom } = await import('@/api/hooks/useSocket');
      useChatRoom.mockReturnValue({
        messages: [],
        typingUsers: { 'user-2': true },
        isJoined: true,
        sendMessage: mockSendSocketMessage,
        sendTyping: mockSendTyping,
      });

      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({ messages: [] });

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
        expect(screen.getByTestId('typing-indicator')).toHaveTextContent('OtherUser is typing...');
      });
    });

    it('should not show typing indicator when no one is typing', async () => {
      // Reset useChatRoom to default (no typing)
      const { useChatRoom } = await import('@/api/hooks/useSocket');
      useChatRoom.mockReturnValue({
        messages: [],
        typingUsers: {},
        isJoined: false,
        sendMessage: mockSendSocketMessage,
        sendTyping: mockSendTyping,
      });

      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({ messages: [] });

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('message-list')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Loading chat history', () => {
    it('should handle loading state while user data loads', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
      render(<PrivateChat />, { wrapper: createWrapper() });
      expect(screen.getByTestId('chat-skeleton')).toBeInTheDocument();
    });

    it('should not show chat UI while loading', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
      render(<PrivateChat />, { wrapper: createWrapper() });
      expect(screen.queryByTestId('chat-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
    });

    it('should show loading skeleton while waiting for other user data', () => {
      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetUserById.mockResolvedValue({ user: null });
      mockGetChatById.mockResolvedValue({ chat: null });

      render(<PrivateChat />, { wrapper: createWrapper() });
      // When otherUser is not yet resolved but userId param exists, should show loading
      expect(screen.getByTestId('chat-skeleton')).toBeInTheDocument();
    });
  });

  describe('Empty chat state', () => {
    it('should handle empty chat with no messages', async () => {
      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({ messages: [] });

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('empty-messages')).toBeInTheDocument();
        expect(screen.getByTestId('empty-messages')).toHaveTextContent('No messages yet');
      });
    });
  });

  describe('Error states', () => {
    beforeEach(async () => {
      // Reset useChatRoom to default for error state tests
      const { useChatRoom } = await import('@/api/hooks/useSocket');
      useChatRoom.mockReturnValue({
        messages: [],
        typingUsers: {},
        isJoined: false,
        sendMessage: mockSendSocketMessage,
        sendTyping: mockSendTyping,
      });
    });

    it('should show error screen when chat query fails (server error)', async () => {
      mockLocationSearch.mockReturnValue('?chatId=chat-999&userId=user-2');
      // Use a 500 error (not 404) to trigger chatError -- 404 is caught and returns null
      mockGetChatById.mockRejectedValue(new Error('Server error'));
      mockGetMessages.mockRejectedValue(new Error('Server error'));

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Chat Not Found')).toBeInTheDocument();
        expect(screen.getByText(/doesn't exist or has been deleted/i)).toBeInTheDocument();
      });
    });

    it('should show error screen with back button for failed chat', async () => {
      mockLocationSearch.mockReturnValue('?chatId=chat-999&userId=user-2');
      mockGetChatById.mockRejectedValue(new Error('Server error'));
      mockGetMessages.mockRejectedValue(new Error('Server error'));

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to feed/i })).toBeInTheDocument();
      });
    });

    it('should show unable to load chat when no userId and no chat', () => {
      mockLocationSearch.mockReturnValue('');
      render(<PrivateChat />, { wrapper: createWrapper() });
      expect(screen.getByText('Unable to Load Chat')).toBeInTheDocument();
    });
  });

  describe('Chat with messages from realtime', () => {
    it('should merge realtime messages with initial messages', async () => {
      const socketMocks = await import('@/api/hooks/useSocket');
      socketMocks.useChatRoom.mockReturnValue({
        messages: [
          { id: 'msg-rt-1', sender_id: 'user-2', content: 'Realtime message', created_date: '2025-01-15T10:05:00Z' },
        ],
        typingUsers: {},
        isJoined: true,
        sendMessage: mockSendSocketMessage,
        sendTyping: mockSendTyping,
      });

      mockLocationSearch.mockReturnValue('?chatId=chat-123&userId=user-2');
      mockGetChatById.mockResolvedValue({
        chat: { id: 'chat-123', is_temporary: false, is_permanent: true, otherUser: { id: 'user-2' } },
      });
      mockGetMessages.mockResolvedValue({
        messages: [
          { id: 'msg-1', sender_id: 'user-1', content: 'Initial message', created_date: '2025-01-15T10:00:00Z' },
        ],
      });

      render(<PrivateChat />, { wrapper: createWrapper() });

      await waitFor(() => {
        const messages = screen.getAllByTestId('message-item');
        expect(messages.length).toBe(2);
      });

      const contents = screen.getAllByTestId('message-content');
      expect(contents[0]).toHaveTextContent('Initial message');
      expect(contents[1]).toHaveTextContent('Realtime message');
    });
  });
});
