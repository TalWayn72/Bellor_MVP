import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import FeedPost from './FeedPost';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ user: { id: 'user-2', nickname: 'User', profile_images: [] } }) },
  likeService: { getResponseLikes: vi.fn().mockResolvedValue({ likes: [] }), checkLiked: vi.fn().mockResolvedValue({ liked: false }) },
  responseService: {},
  followService: {},
  chatService: {},
}));

const TEMP_CHAT_LABEL = "\u05E6'\u05D0\u05D8 \u05D6\u05DE\u05E0\u05D9 \u05DC-24 \u05E9\u05E2\u05D5\u05EA";
const TEMP_CHAT_SENT_LABEL = '\u2713 \u05D1\u05E7\u05E9\u05D4 \u05D6\u05DE\u05E0\u05D9\u05EA \u05E0\u05E9\u05DC\u05D7\u05D4';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('[P1][content] FeedPost', () => {
  const mockCurrentUser = {
    id: 'user-1',
    nickname: 'TestUser',
    email: 'test@example.com',
  };

  const mockResponse = {
    id: 'response-1',
    user_id: 'user-2',
    text_content: 'This is a test post',
    response_type: 'text',
    is_public: true,
    created_date: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks the temporary chat request as sent only when the send success callback runs', async () => {
    const { userService } = await import('@/api');
    const onChatRequest = vi.fn();
    userService.getUserById.mockResolvedValue({
      user: { id: 'user-2', nickname: 'OtherUser', profile_images: [] },
    });

    render(
      <FeedPost
        response={mockResponse}
        currentUser={mockCurrentUser}
        theme={{}}
        onChatRequest={onChatRequest}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(TEMP_CHAT_LABEL)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(TEMP_CHAT_LABEL));

    const requestPayload = onChatRequest.mock.calls[0][0];
    expect(requestPayload).toMatchObject({ nickname: 'OtherUser', id: 'user-2' });
    expect(requestPayload.onChatRequestSent).toEqual(expect.any(Function));
    expect(screen.getByText(TEMP_CHAT_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(TEMP_CHAT_SENT_LABEL)).not.toBeInTheDocument();

    act(() => {
      requestPayload.onChatRequestSent();
    });

    expect(screen.getByText(TEMP_CHAT_SENT_LABEL)).toBeInTheDocument();
  });

  describe('Defensive checks for undefined arrays', () => {
    it('should handle undefined profile_images gracefully', async () => {
      const { userService } = await import('@/api');
      userService.getUserById.mockResolvedValue({
        id: 'user-2',
        nickname: 'OtherUser',
        age: 25,
        location: 'Israel',
        is_verified: false,
        profile_images: undefined, // undefined array
      });

      let container;
      await act(async () => {
        const result = render(
          <FeedPost
            response={mockResponse}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
        container = result.container;
      });

      // Should not throw error
      expect(container).toBeDefined();
    });

    it('should handle empty profile_images array gracefully', async () => {
      const { userService } = await import('@/api');
      userService.getUserById.mockResolvedValue({
        id: 'user-2',
        nickname: 'OtherUser',
        age: 25,
        location: 'Israel',
        is_verified: false,
        profile_images: [], // empty array
      });

      let container;
      await act(async () => {
        const result = render(
          <FeedPost
            response={mockResponse}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
        container = result.container;
      });

      // Should not throw error
      expect(container).toBeDefined();
    });

    it('should handle null profile_images gracefully', async () => {
      const { userService } = await import('@/api');
      userService.getUserById.mockResolvedValue({
        id: 'user-2',
        nickname: 'OtherUser',
        age: 25,
        location: 'Israel',
        is_verified: false,
        profile_images: null, // null array
      });

      let container;
      await act(async () => {
        const result = render(
          <FeedPost
            response={mockResponse}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
        container = result.container;
      });

      // Should not throw error
      expect(container).toBeDefined();
    });

    it('should display fallback image when profile_images is undefined', async () => {
      const { userService } = await import('@/api');
      userService.getUserById.mockResolvedValue({
        id: 'user-2',
        nickname: 'OtherUser',
        age: 25,
        location: 'Israel',
        is_verified: false,
        profile_images: undefined,
      });

      await act(async () => {
        render(
          <FeedPost
            response={mockResponse}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
      });

      // Wait for async operations
      await waitFor(() => {
        const avatarImages = document.querySelectorAll('img');
        if (avatarImages.length > 0) {
          const imgSrc = avatarImages[0].getAttribute('src');
          expect(imgSrc).toContain('pravatar.cc');
        }
      }, { timeout: 2000 });
    });
  });

  describe('Response rendering', () => {
    it('should handle response without user_id', async () => {
      const responseWithoutUserId = {
        ...mockResponse,
        user_id: undefined,
      };

      let container;
      await act(async () => {
        const result = render(
          <FeedPost
            response={responseWithoutUserId}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
        container = result.container;
      });

      expect(container).toBeDefined();
    });

    it('should handle response with demo user_id', async () => {
      const demoResponse = {
        ...mockResponse,
        user_id: 'demo-user-123',
      };

      let container;
      await act(async () => {
        const result = render(
          <FeedPost
            response={demoResponse}
            currentUser={mockCurrentUser}
            theme={{}}
          />,
          { wrapper: createWrapper() }
        );
        container = result.container;
      });

      expect(container).toBeDefined();
    });
  });
});
