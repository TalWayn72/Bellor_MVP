import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  chatService: { getChatById: vi.fn().mockResolvedValue({ chat: null }) },
  userService: { getUserById: vi.fn().mockResolvedValue({ user: null }) },
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

vi.mock('@/components/video/VideoDateUI', () => ({
  default: ({ otherUser, isAudioOn, isVideoOn }) => (
    <div data-testid="video-date-ui">
      <span>Video Date UI</span>
      <span data-testid="audio-status">{isAudioOn ? 'on' : 'off'}</span>
      <span data-testid="video-status">{isVideoOn ? 'on' : 'off'}</span>
    </div>
  ),
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
});

import VideoDate from './VideoDate';

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

describe('VideoDate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<VideoDate />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the VideoDateUI component', () => {
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByTestId('video-date-ui')).toBeInTheDocument();
  });

  it('starts with audio and video enabled', () => {
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByTestId('audio-status')).toHaveTextContent('on');
    expect(screen.getByTestId('video-status')).toHaveTextContent('on');
  });

  it('shows loading state when user is loading', async () => {
    const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
    useCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    render(<VideoDate />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
