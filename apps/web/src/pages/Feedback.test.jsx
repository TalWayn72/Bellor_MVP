import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

vi.mock('@/components/feedback/FeedbackForm', () => ({
  default: ({ feedbackType, onSubmit, isPending }) => (
    <div data-testid="feedback-form">
      <span>Type: {feedbackType}</span>
      <button onClick={onSubmit} disabled={isPending}>Submit</button>
    </div>
  ),
}));

import Feedback from './Feedback';

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

describe('[P3][profile] Feedback', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<Feedback />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<Feedback />, { wrapper: createWrapper() });
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  it('renders hero section', () => {
    render(<Feedback />, { wrapper: createWrapper() });
    expect(screen.getByText('We Value Your Input')).toBeInTheDocument();
  });

  it('renders feedback form', () => {
    render(<Feedback />, { wrapper: createWrapper() });
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument();
  });

  it('renders thank you card', () => {
    render(<Feedback />, { wrapper: createWrapper() });
    expect(screen.getByText(/Thank You/)).toBeInTheDocument();
  });

  it('renders form with default feedback type', () => {
    render(<Feedback />, { wrapper: createWrapper() });
    expect(screen.getByText('Type: improvement')).toBeInTheDocument();
  });
});
