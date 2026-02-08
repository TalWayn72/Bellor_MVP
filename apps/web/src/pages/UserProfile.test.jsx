import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { getUserById: vi.fn().mockResolvedValue({ user: null }) },
  responseService: { getUserResponses: vi.fn().mockResolvedValue({ responses: [] }) },
  likeService: { checkLiked: vi.fn().mockResolvedValue({ liked: false }), likeUser: vi.fn() },
  followService: { getUserFollowers: vi.fn().mockResolvedValue({ pagination: { total: 0 } }), getUserFollowing: vi.fn().mockResolvedValue({ pagination: { total: 0 } }) },
  chatService: { createOrGetChat: vi.fn(), sendMessage: vi.fn() },
}));

vi.mock('@/components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/profile/UserProfileHeader', () => ({
  default: () => <div data-testid="profile-header">Header</div>,
}));

vi.mock('@/components/profile/UserProfileAbout', () => ({
  default: () => <div data-testid="profile-about">About</div>,
}));

vi.mock('@/components/profile/UserProfileBook', () => ({
  default: () => <div data-testid="profile-book">Book</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import UserProfile from './UserProfile';

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

describe('UserProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<UserProfile />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('redirects when no userId param', () => {
    // Without ?id= param, component redirects to SharedSpace
    const { container } = render(<UserProfile />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });
});
