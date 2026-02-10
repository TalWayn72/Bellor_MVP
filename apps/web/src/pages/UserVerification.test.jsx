import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
  uploadService: { uploadFile: vi.fn().mockResolvedValue({ file_url: 'http://test.com/photo.jpg' }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', is_verified: false },
    isLoading: false,
  })),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/verification/VerificationSteps', () => ({
  VerificationInstructions: () => <div data-testid="verification-instructions">Instructions</div>,
  CameraView: ({ onStartCamera }) => (
    <div data-testid="camera-view">
      <button onClick={onStartCamera}>Start Camera</button>
    </div>
  ),
  VerificationPreview: ({ onRetake, onSubmit }) => (
    <div data-testid="verification-preview">
      <button onClick={onRetake}>Retake</button>
      <button onClick={onSubmit}>Submit</button>
    </div>
  ),
}));

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }) },
});

import UserVerification from './UserVerification';

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

describe('[P0][safety] UserVerification', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<UserVerification />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<UserVerification />, { wrapper: createWrapper() });
    expect(screen.getByText('Photo Verification')).toBeInTheDocument();
  });

  it('renders verification instructions', () => {
    render(<UserVerification />, { wrapper: createWrapper() });
    expect(screen.getByTestId('verification-instructions')).toBeInTheDocument();
  });

  it('renders camera view by default', () => {
    render(<UserVerification />, { wrapper: createWrapper() });
    expect(screen.getByTestId('camera-view')).toBeInTheDocument();
  });

  it('renders start camera button', () => {
    render(<UserVerification />, { wrapper: createWrapper() });
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });

  it('shows loading when user is loading', async () => {
    const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
    useCurrentUser.mockReturnValue({ currentUser: null, isLoading: true });
    render(<UserVerification />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  describe('media stream cleanup on unmount', () => {
    it('should stop camera stream tracks on unmount after starting camera', async () => {
      // Reset useCurrentUser mock explicitly (previous test may have changed it)
      const { useCurrentUser } = await import('../components/hooks/useCurrentUser');
      useCurrentUser.mockReturnValue({
        currentUser: { id: 'user-1', nickname: 'TestUser', is_verified: false },
        isLoading: false,
      });

      const user = userEvent.setup();
      const mockStop = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: mockStop }],
      };
      navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

      const { unmount } = render(<UserVerification />, { wrapper: createWrapper() });

      // Click Start Camera
      await user.click(screen.getByText('Start Camera'));
      await new Promise(r => setTimeout(r, 0));

      // Unmount should stop the stream
      unmount();
      expect(mockStop).toHaveBeenCalled();
    });
  });
});
