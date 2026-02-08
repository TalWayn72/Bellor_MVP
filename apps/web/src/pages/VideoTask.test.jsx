import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('VideoTask', () => {
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
