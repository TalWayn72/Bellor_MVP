import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  chatService: { getChats: vi.fn().mockResolvedValue({ chats: [] }) },
}));

vi.mock('../components/admin/LayoutAdmin', () => ({
  default: ({ children }) => <div data-testid="layout-admin">{children}</div>,
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Legend: () => null,
  Tooltip: () => null,
}));

vi.mock('@/components/admin/MonitoredChatList', () => ({
  default: () => <div data-testid="chat-list">Chat List</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import AdminChatMonitoring from './AdminChatMonitoring';

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

describe('[P2][admin] AdminChatMonitoring', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<AdminChatMonitoring />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<AdminChatMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Chat Monitoring')).toBeInTheDocument();
  });

  it('renders inside LayoutAdmin', () => {
    render(<AdminChatMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByTestId('layout-admin')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<AdminChatMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Total Chats')).toBeInTheDocument();
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    expect(screen.getByText('Reported')).toBeInTheDocument();
  });

  it('renders chat distribution section', () => {
    render(<AdminChatMonitoring />, { wrapper: createWrapper() });
    expect(screen.getByText('Chat Distribution')).toBeInTheDocument();
  });
});
