import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  default: ({ onShare, setTextContent }) => (
    <div data-testid="writing-prompt">
      Prompt
      <button data-testid="mock-set-text" onClick={() => { if (setTextContent) setTextContent('Test writing content'); }}>
        Set Text
      </button>
      <button data-testid="mock-share-btn" onClick={() => { if (onShare) onShare(); }}>
        Share
      </button>
    </div>
  ),
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

describe('[P1][content] WriteTask', () => {
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

describe('[P1][regression] ISSUE-084 - mission creation schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createMission with correct fields (title, description, missionType) when no mission exists', async () => {
    const { missionService, responseService } = await import('@/api');
    missionService.getTodaysMission.mockResolvedValue({ data: null });
    missionService.createMission.mockResolvedValue({ data: { id: 'new-mission-1' } });
    responseService.createResponse.mockResolvedValue({});

    render(<WriteTask />, { wrapper: createWrapper() });

    // First set text content so handleShare validation passes
    const setTextBtn = screen.getByTestId('mock-set-text');
    await userEvent.click(setTextBtn);

    // Then trigger share
    const shareBtn = screen.getByTestId('mock-share-btn');
    await userEvent.click(shareBtn);

    await waitFor(() => {
      expect(missionService.createMission).toHaveBeenCalledTimes(1);
    });

    const callArg = missionService.createMission.mock.calls[0][0];

    // Verify correct fields are present
    expect(callArg).toHaveProperty('title');
    expect(callArg).toHaveProperty('description');
    expect(callArg).toHaveProperty('missionType', 'DAILY');

    // Verify old/wrong fields are NOT sent (the bug from ISSUE-084)
    expect(callArg).not.toHaveProperty('question');
    expect(callArg).not.toHaveProperty('category');
    expect(callArg).not.toHaveProperty('responseTypes');
    expect(callArg).not.toHaveProperty('date');
    expect(callArg).not.toHaveProperty('isActive');
  });
});
