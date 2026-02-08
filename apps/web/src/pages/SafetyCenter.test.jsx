import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  reportService: { createReport: vi.fn().mockResolvedValue({}) },
}));

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

vi.mock('@/components/safety/SafetyContent', () => ({
  SafetyHero: () => <div data-testid="safety-hero">Safety Hero</div>,
  QuickActions: ({ onShowReportForm }) => (
    <div data-testid="quick-actions">
      <button onClick={onShowReportForm}>Report</button>
    </div>
  ),
  SafetyTips: () => <div data-testid="safety-tips">Tips</div>,
  EmergencyContact: () => <div data-testid="emergency-contact">Emergency</div>,
}));

vi.mock('@/components/safety/ReportFormModal', () => ({
  default: () => <div data-testid="report-modal">Report Form</div>,
}));

import SafetyCenter from './SafetyCenter';

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

describe('SafetyCenter', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByText('Safety Center')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByText('Safety and Security Center')).toBeInTheDocument();
  });

  it('renders safety hero section', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByTestId('safety-hero')).toBeInTheDocument();
  });

  it('renders quick actions', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('renders safety tips', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByTestId('safety-tips')).toBeInTheDocument();
  });

  it('renders emergency contact', () => {
    render(<SafetyCenter />, { wrapper: createWrapper() });
    expect(screen.getByTestId('emergency-contact')).toBeInTheDocument();
  });
});
