import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  storyService: { getFeed: vi.fn().mockResolvedValue({ stories: [] }), getMyStories: vi.fn().mockResolvedValue({ stories: [] }), viewStory: vi.fn() },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/data/demoData', () => ({
  getDemoStories: vi.fn(() => []),
}));

vi.mock('@/components/stories/StoryUserAvatar', () => ({
  default: () => <div data-testid="story-avatar">Avatar</div>,
}));

vi.mock('@/components/stories/StoryViewer', () => ({
  default: () => <div data-testid="story-viewer">Viewer</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Stories from './Stories';

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

describe('Stories', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Stories />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Stories />, { wrapper: createWrapper() });
    expect(screen.getByText('Stories')).toBeInTheDocument();
  });

  it('renders your story section', () => {
    render(<Stories />, { wrapper: createWrapper() });
    expect(screen.getByText('Your Story')).toBeInTheDocument();
  });

  it('renders create story button', () => {
    render(<Stories />, { wrapper: createWrapper() });
    expect(screen.getByText('Create Story')).toBeInTheDocument();
  });

  it('renders recent stories section', () => {
    render(<Stories />, { wrapper: createWrapper() });
    expect(screen.getByText('Recent Stories')).toBeInTheDocument();
  });
});
