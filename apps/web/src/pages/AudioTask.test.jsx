import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
      <button onClick={() => onShare(new Blob(), true)}>Record</button>
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
