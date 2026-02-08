import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}), exportUserData: vi.fn(), deleteUserGDPR: vi.fn() },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
    updateUser: vi.fn(),
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/settings/PrivacyToggles', () => ({
  default: () => <div data-testid="privacy-toggles">Toggles</div>,
}));

vi.mock('@/components/settings/GDPRSection', () => ({
  default: () => <div data-testid="gdpr-section">GDPR</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import PrivacySettings from './PrivacySettings';

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

describe('PrivacySettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
  });

  it('renders privacy toggles', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('privacy-toggles')).toBeInTheDocument();
  });

  it('renders GDPR section', () => {
    render(<PrivacySettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('gdpr-section')).toBeInTheDocument();
  });
});
