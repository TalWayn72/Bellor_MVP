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

import HelpSupport from './HelpSupport';

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

describe('HelpSupport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<HelpSupport />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<HelpSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('renders FAQ link', () => {
    render(<HelpSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Frequently asked questions')).toBeInTheDocument();
  });

  it('renders Live Chat link', () => {
    render(<HelpSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
  });

  it('renders Email Support link', () => {
    render(<HelpSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Email Support')).toBeInTheDocument();
    expect(screen.getByText('support@bellor.com')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<HelpSupport />, { wrapper: createWrapper() });
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });
});
