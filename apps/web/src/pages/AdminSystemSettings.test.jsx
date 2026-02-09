import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('@/components/admin/SystemSettingsForm', () => ({
  default: ({ settings }) => (
    <div data-testid="settings-form">{settings.map((s) => <span key={s.id}>{s.key}</span>)}</div>
  ),
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminSystemSettings from './AdminSystemSettings';

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

describe('AdminSystemSettings', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminSystemSettings />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminSystemSettings />, { wrapper: createWrapper() });
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminSystemSettings />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders settings categories', async () => {
    render(<AdminSystemSettings />, { wrapper: createWrapper() });
    // Wait for async query to resolve so categories render instead of skeleton
    expect(await screen.findByText('Limits')).toBeInTheDocument();
    // "System Settings" appears as both the heading and a category name
    expect(screen.getAllByText('System Settings').length).toBeGreaterThanOrEqual(1);
  });

  it('renders settings form', async () => {
    render(<AdminSystemSettings />, { wrapper: createWrapper() });
    // Wait for async query to resolve so form renders
    const forms = await screen.findAllByTestId('settings-form');
    expect(forms.length).toBeGreaterThan(0);
  });
});
