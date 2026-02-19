import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  missionService: {
    getTodaysMission: vi.fn().mockResolvedValue({ data: { title: 'Test Mission', question: 'Test question?', subtitle: 'Record it!' } }),
    createMission: vi.fn().mockResolvedValue({ data: { id: 'mission-1' } }),
  },
  responseService: { createResponse: vi.fn().mockResolvedValue({}) },
  uploadService: { uploadFile: vi.fn().mockResolvedValue({ url: 'http://test.com/audio.webm' }) },
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

vi.mock('@/components/tasks/AudioRecorder', () => ({
  default: ({ onShare }) => (
    <div data-testid="audio-recorder">
      <button onClick={() => onShare(new Blob(['audio'], { type: 'audio/webm' }), true, 10, 'audio/webm', '.webm')}>Record</button>
    </div>
  ),
}));

import AudioTask from './AudioTask';

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

describe('[P1][content] AudioTask', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AudioTask />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading after data loads', async () => {
    render(<AudioTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Bellor today')).toBeInTheDocument();
  });

  it('renders audio task subtitle after data loads', async () => {
    render(<AudioTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Task - Audio')).toBeInTheDocument();
  });

  it('renders audio recorder component after data loads', async () => {
    render(<AudioTask />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('audio-recorder')).toBeInTheDocument();
  });

  it('renders task type navigation buttons after data loads', async () => {
    render(<AudioTask />, { wrapper: createWrapper() });
    expect(await screen.findByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
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

    render(<AudioTask />, { wrapper: createWrapper() });

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
  });
});
