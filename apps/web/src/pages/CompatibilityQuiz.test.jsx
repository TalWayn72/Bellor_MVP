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

vi.mock('@/components/quiz/QuizQuestions', () => ({
  demoQuestions: [
    { id: 'q1', text: 'What matters most?', options: ['Love', 'Career', 'Fun'] },
    { id: 'q2', text: 'Ideal weekend?', options: ['Beach', 'Mountains', 'City'] },
  ],
  QuestionCard: ({ question, questionIndex, totalQuestions }) => (
    <div data-testid="question-card">
      <span>{question.text}</span>
      <span data-testid="progress">{questionIndex + 1}/{totalQuestions}</span>
    </div>
  ),
  QuizInfoCard: () => <div data-testid="quiz-info">Quiz Info</div>,
}));

import CompatibilityQuiz from './CompatibilityQuiz';

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

describe('CompatibilityQuiz', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(screen.getByText('Compatibility Quiz')).toBeInTheDocument();
  });

  it('renders the question card', () => {
    render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(screen.getByTestId('question-card')).toBeInTheDocument();
  });

  it('renders skip button', () => {
    render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(screen.getByText('Skip this question')).toBeInTheDocument();
  });

  it('renders quiz info card', () => {
    render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quiz-info')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(<CompatibilityQuiz />, { wrapper: createWrapper() });
    expect(screen.getByTestId('progress')).toHaveTextContent('1/2');
  });
});
