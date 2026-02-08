import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import PrivacyPolicy from './PrivacyPolicy';

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

describe('PrivacyPolicy', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('Your Privacy Matters')).toBeInTheDocument();
  });

  it('renders privacy policy title', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders policy sections', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('9. Your Rights')).toBeInTheDocument();
    expect(screen.getByText('14. GDPR Rights (EU Users)')).toBeInTheDocument();
  });

  it('renders contact section', () => {
    render(<PrivacyPolicy />, { wrapper: createWrapper() });
    expect(screen.getByText('Contact Privacy Team')).toBeInTheDocument();
  });
});
