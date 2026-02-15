import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  missionService: {
    getTodaysMission: vi.fn().mockResolvedValue({
      data: { question: 'Which type of energy?', options: ['Subtle energy', 'Grounded', 'Primal'] },
    }),
    createMission: vi.fn().mockResolvedValue({ data: { id: 'mission-1' } }),
  },
  responseService: { createResponse: vi.fn().mockResolvedValue({}) },
  uploadService: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://test.com/video.webm' }) },
  userService: { updateProfile: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', response_count: 0, mission_completed_count: 0 },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/tasks/VideoRecorder', () => ({
  default: ({ onShare }) => (
    <div data-testid="video-recorder">
      <button onClick={() => onShare('blob:test', true)}>Record</button>
    </div>
  ),
}));

import VideoTask from './VideoTask';

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

describe('[P1][content] VideoTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<VideoTask />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Bellor today')).toBeInTheDocument();
  });

  it('renders video task subtitle after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Task - Video')).toBeInTheDocument();
  });

  it('renders video recorder component after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('video-recorder')).toBeInTheDocument();
  });

  it('renders task type navigation buttons after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('renders share text after data loads', async () => {
    render(<VideoTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Choose your way to share')).toBeInTheDocument();
  });
});

describe('[P1][regression] ISSUE-084 - mission creation schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createMission with correct fields (title, description, missionType) when no mission exists', async () => {
    const { missionService } = await import('@/api');
    missionService.getTodaysMission.mockResolvedValue({ data: null });
    missionService.createMission.mockResolvedValue({ data: { id: 'new-mission-1' } });

    // Mock fetch for blob:test URL conversion in handleShare
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['video'], { type: 'video/webm' })),
    });

    render(<VideoTask />, { wrapper: createWrapper() });

    // Wait for component to finish loading (query resolves)
    await screen.findByText('Record');
    const recordButton = screen.getByText('Record');
    await userEvent.click(recordButton);

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

    globalThis.fetch = originalFetch;
  });
});
