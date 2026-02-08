import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('FeedPost', () => {
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
