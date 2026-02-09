import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLikeUser = vi.fn().mockResolvedValue({ isMatch: false });
const mockSearchUsers = vi.fn().mockResolvedValue({ users: [] });

vi.mock('@/api', () => ({
  userService: { searchUsers: (...args) => mockSearchUsers(...args) },
  likeService: { likeUser: (...args) => mockLikeUser(...args) },
}));

const mockUseCurrentUser = vi.fn(() => ({
  currentUser: { id: 'user-1', nickname: 'TestUser' },
  isLoading: false,
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: (...args) => mockUseCurrentUser(...args),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

const mockDemoProfiles = [
  {
    id: 'demo-1',
    nickname: 'Alice',
    age: 25,
    onboarding_completed: true,
    profile_images: ['https://example.com/alice.jpg'],
    bio: 'Love hiking',
    location: 'Tel Aviv',
    interests: ['Music', 'Travel'],
  },
  {
    id: 'demo-2',
    nickname: 'Bob',
    age: 28,
    onboarding_completed: true,
    profile_images: ['https://example.com/bob.jpg'],
    bio: 'Coffee lover',
    location: 'Haifa',
    interests: ['Coffee', 'Reading'],
  },
];

vi.mock('@/data/demoData', () => ({
  getDemoProfiles: () => mockDemoProfiles,
}));

// DiscoverCard mock that renders profile info and action buttons
vi.mock('@/components/discover/DiscoverCard', () => ({
  default: ({ profile, onLike, onPass, onSuperLike }) => (
    <div data-testid="discover-card">
      <span data-testid="profile-nickname">{profile.nickname}</span>
      <span data-testid="profile-age">{profile.age}</span>
      <span data-testid="profile-bio">{profile.bio}</span>
      <button data-testid="like-button" onClick={onLike}>Like</button>
      <button data-testid="pass-button" onClick={onPass}>Pass</button>
      <button data-testid="superlike-button" onClick={onSuperLike}>Super Like</button>
    </div>
  ),
}));

vi.mock('@/components/discover/DiscoverFilters', () => ({
  default: ({ onClose }) => (
    <div data-testid="discover-filters">
      <button data-testid="close-filters" onClick={onClose}>Close Filters</button>
    </div>
  ),
}));

vi.mock('@/components/states', () => ({
  CardsSkeleton: ({ count }) => <div data-testid="cards-skeleton">Loading {count} cards...</div>,
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import Discover from './Discover';

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

// Helper: wait until the first discover card loads (query resolves)
const waitForProfiles = async () => {
  await waitFor(() => {
    expect(screen.getByTestId('discover-card')).toBeInTheDocument();
  });
};

describe('Discover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      currentUser: { id: 'user-1', nickname: 'TestUser' },
      isLoading: false,
    });
    mockLikeUser.mockResolvedValue({ isMatch: false });
    mockSearchUsers.mockResolvedValue({ users: [] });
  });

  // --- Existing scaffold tests ---

  it('renders without crashing', () => {
    const { container } = render(<Discover />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Discover />, { wrapper: createWrapper() });
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<Discover />, { wrapper: createWrapper() });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when user is loading', () => {
    mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    render(<Discover />, { wrapper: createWrapper() });
    expect(screen.getByTestId('cards-skeleton')).toBeInTheDocument();
  });

  // --- New behavioral tests ---

  describe('Discovery cards rendering', () => {
    it('should render a discovery card with first profile', async () => {
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();
      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Alice');
    });

    it('should display user information on cards', async () => {
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();
      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Alice');
      expect(screen.getByTestId('profile-age')).toHaveTextContent('25');
      expect(screen.getByTestId('profile-bio')).toHaveTextContent('Love hiking');
    });

    it('should have like/pass action buttons', async () => {
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();
      expect(screen.getByTestId('like-button')).toBeInTheDocument();
      expect(screen.getByTestId('pass-button')).toBeInTheDocument();
      expect(screen.getByTestId('superlike-button')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should handle empty state when no more users', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      // Pass through all demo profiles
      await user.click(screen.getByTestId('pass-button'));
      await user.click(screen.getByTestId('pass-button'));

      // Now all profiles are exhausted, should show empty state
      expect(screen.getByText('No more profiles')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new matches')).toBeInTheDocument();
    });

    it('should show Start Over button in empty state', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('pass-button'));
      await user.click(screen.getByTestId('pass-button'));

      expect(screen.getByRole('button', { name: 'Start Over' })).toBeInTheDocument();
    });

    it('should restart profiles when Start Over is clicked', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      // Exhaust all profiles
      await user.click(screen.getByTestId('pass-button'));
      await user.click(screen.getByTestId('pass-button'));

      expect(screen.getByText('No more profiles')).toBeInTheDocument();

      // Click Start Over
      await user.click(screen.getByRole('button', { name: 'Start Over' }));

      // First profile should be shown again
      expect(screen.getByTestId('discover-card')).toBeInTheDocument();
      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Alice');
    });
  });

  describe('Loading state', () => {
    it('should handle loading state by showing skeleton', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
      render(<Discover />, { wrapper: createWrapper() });
      expect(screen.getByTestId('cards-skeleton')).toBeInTheDocument();
    });

    it('should not show discovery cards while loading', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
      render(<Discover />, { wrapper: createWrapper() });
      expect(screen.queryByTestId('discover-card')).not.toBeInTheDocument();
    });

    it('should not show page heading while loading', () => {
      mockUseCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
      render(<Discover />, { wrapper: createWrapper() });
      expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    });
  });

  describe('Like action', () => {
    it('should call likeService.likeUser on like action', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(mockLikeUser).toHaveBeenCalledWith('demo-1', 'ROMANTIC');
      });
    });

    it('should advance to next profile after like', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Alice');

      await user.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Bob');
      });
    });

    it('should show match toast when like results in a match', async () => {
      mockLikeUser.mockResolvedValue({ isMatch: true });
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('like-button'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Success', description: "It's a match!" })
        );
      });
    });
  });

  describe('Pass action', () => {
    it('should advance to next profile on pass', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Alice');

      await user.click(screen.getByTestId('pass-button'));

      expect(screen.getByTestId('profile-nickname')).toHaveTextContent('Bob');
    });

    it('should not call the like API on pass', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('pass-button'));

      expect(mockLikeUser).not.toHaveBeenCalled();
    });
  });

  describe('API error handling', () => {
    it('should handle likeUser API error gracefully', async () => {
      mockLikeUser.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      // Should not throw when like fails
      await user.click(screen.getByTestId('like-button'));

      // Component should still be rendered (shows next profile or empty state)
      await waitFor(() => {
        expect(screen.getByTestId('discover-card')).toBeInTheDocument();
      });
    });
  });

  describe('Filters', () => {
    it('should open filters panel on filter button click', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });

      // Filter button is the first button in the header (SlidersHorizontal icon)
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);

      expect(screen.getByTestId('discover-filters')).toBeInTheDocument();
    });

    it('should close filters panel on close', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });

      // Open filters
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(screen.getByTestId('discover-filters')).toBeInTheDocument();

      // Close filters
      await user.click(screen.getByTestId('close-filters'));
      expect(screen.queryByTestId('discover-filters')).not.toBeInTheDocument();
    });
  });

  describe('Super Like', () => {
    it('should open super like modal when super like is clicked', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('superlike-button'));

      // Super like modal should appear with the heading
      expect(screen.getByRole('heading', { name: 'Send Super Like' })).toBeInTheDocument();
      // The modal description mentions the target user's nickname
      const allAlice = screen.getAllByText(/Alice/);
      expect(allAlice.length).toBeGreaterThanOrEqual(2); // card + modal text
    });

    it('should show message textarea in super like modal', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('superlike-button'));

      expect(screen.getByPlaceholderText(/write a message/i)).toBeInTheDocument();
    });

    it('should close super like modal on cancel', async () => {
      const user = userEvent.setup();
      render(<Discover />, { wrapper: createWrapper() });
      await waitForProfiles();

      await user.click(screen.getByTestId('superlike-button'));
      expect(screen.getByRole('heading', { name: 'Send Super Like' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('heading', { name: 'Send Super Like' })).not.toBeInTheDocument();
    });
  });
});
