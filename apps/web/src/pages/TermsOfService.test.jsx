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

import TermsOfService from './TermsOfService';

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

describe('TermsOfService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<TermsOfService />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<TermsOfService />, { wrapper: createWrapper() });
    // "Terms of Service" appears in both the header and the hero section
    expect(screen.getAllByText('Terms of Service').length).toBeGreaterThanOrEqual(1);
  });

  it('renders terms title', () => {
    render(<TermsOfService />, { wrapper: createWrapper() });
    expect(screen.getByText('Bell\u00f8r Terms of Service')).toBeInTheDocument();
  });

  it('renders terms sections', () => {
    render(<TermsOfService />, { wrapper: createWrapper() });
    expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument();
    expect(screen.getByText('2. Eligibility')).toBeInTheDocument();
    expect(screen.getByText('12. Data Protection')).toBeInTheDocument();
  });

  it('renders contact section', () => {
    render(<TermsOfService />, { wrapper: createWrapper() });
    expect(screen.getByText('Contact Legal Team')).toBeInTheDocument();
  });
});
