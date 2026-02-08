import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('@/components/admin/PreRegTable', () => ({
  default: () => <div data-testid="prereg-table">Table</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminPreRegistration from './AdminPreRegistration';

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

describe('AdminPreRegistration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(screen.getByText('Pre-Registrations')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders email and whatsapp template sections', () => {
    render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(screen.getByText('Email Template')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Template')).toBeInTheDocument();
  });

  it('renders stats cards', () => {
    render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(screen.getByText('Total Registrations')).toBeInTheDocument();
    expect(screen.getByText('Email Sent')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Sent')).toBeInTheDocument();
  });

  it('renders registrants list', () => {
    render(<AdminPreRegistration />, { wrapper: createWrapper() });
    expect(screen.getByText('Registrants List')).toBeInTheDocument();
  });
});
