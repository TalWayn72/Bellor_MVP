import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  storyService: { createStory: vi.fn().mockResolvedValue({}) },
  uploadService: { uploadStoryMedia: vi.fn().mockResolvedValue({ url: 'http://test.com/story.jpg' }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/stories/StoryPreview', () => ({
  default: ({ storyType, isPending, onPublish }) => (
    <div data-testid="story-preview">
      <span data-testid="story-type">{storyType}</span>
      <button onClick={onPublish} disabled={isPending}>Publish</button>
    </div>
  ),
}));

import CreateStory from './CreateStory';

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

describe('[P1][content] CreateStory', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<CreateStory />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders story preview component', () => {
    render(<CreateStory />, { wrapper: createWrapper() });
    expect(screen.getByTestId('story-preview')).toBeInTheDocument();
  });

  it('starts with text story type', () => {
    render(<CreateStory />, { wrapper: createWrapper() });
    expect(screen.getByTestId('story-type')).toHaveTextContent('text');
  });

  it('renders publish button', () => {
    render(<CreateStory />, { wrapper: createWrapper() });
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('has hidden file input for image upload', () => {
    const { container } = render(<CreateStory />, { wrapper: createWrapper() });
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeDefined();
    expect(fileInput).toHaveClass('hidden');
  });

  it('shows loading when user is loading', async () => {
    const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
    useCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    render(<CreateStory />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
