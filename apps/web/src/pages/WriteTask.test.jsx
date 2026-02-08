import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  missionService: { getTodaysMission: vi.fn().mockResolvedValue({ data: null }), createMission: vi.fn() },
  responseService: { createResponse: vi.fn() },
  userService: { searchUsers: vi.fn().mockResolvedValue({ users: [] }) },
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

vi.mock('../components/feed/HashtagExtractor', () => ({
  extractHashtags: vi.fn(() => []),
}));

vi.mock('../components/feed/MentionExtractor', () => ({
  extractMentions: vi.fn(() => []),
}));

vi.mock('@/components/tasks/WritingPrompt', () => ({
  default: () => <div data-testid="writing-prompt">Prompt</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import WriteTask from './WriteTask';

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

describe('WriteTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<WriteTask />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<WriteTask />, { wrapper: createWrapper() });
    expect(screen.getByText('Bellor today')).toBeInTheDocument();
  });

  it('renders task subtitle', () => {
    render(<WriteTask />, { wrapper: createWrapper() });
    expect(screen.getByText('Task - Write')).toBeInTheDocument();
  });

  it('renders writing prompt', () => {
    render(<WriteTask />, { wrapper: createWrapper() });
    expect(screen.getByTestId('writing-prompt')).toBeInTheDocument();
  });

  it('renders navigation to other task types', () => {
    render(<WriteTask />, { wrapper: createWrapper() });
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });
});
