import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/support/faqData', () => ({
  faqs: [
    { id: 'f1', question: 'How do I create an account?', answer: 'Download the app and sign up.', category: 'Getting Started' },
    { id: 'f2', question: 'How do I delete my account?', answer: 'Go to settings and click delete.', category: 'Account' },
    { id: 'f3', question: 'Is Bellor free?', answer: 'Yes, with optional premium.', category: 'Getting Started' },
  ],
}));

import FAQ from './FAQ';

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

describe('[P3][profile] FAQ', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<FAQ />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Search questions...')).toBeInTheDocument();
  });

  it('renders FAQ questions', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
    expect(screen.getByText('How do I delete my account?')).toBeInTheDocument();
    expect(screen.getByText('Is Bellor free?')).toBeInTheDocument();
  });

  it('renders category headers', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders contact support button', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('renders still need help section', () => {
    render(<FAQ />, { wrapper: createWrapper() });
    expect(screen.getByText('Still need help?')).toBeInTheDocument();
  });
});
