import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  chatService: { getChats: vi.fn().mockResolvedValue({ chats: [] }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser' },
    isLoading: false,
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/data/demoData', () => ({
  getDemoTempChats: vi.fn(() => []),
}));

vi.mock('../components/user/UserBioDialog', () => ({
  default: () => <div data-testid="bio-dialog">Dialog</div>,
}));

vi.mock('@/components/chat/TempChatCard', () => ({
  default: () => <div data-testid="temp-chat-card">Chat</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import TemporaryChats from './TemporaryChats';

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

describe('TemporaryChats', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<TemporaryChats />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<TemporaryChats />, { wrapper: createWrapper() });
    expect(screen.getByText('Temporary Chats')).toBeInTheDocument();
  });

  it('renders filter buttons', () => {
    render(<TemporaryChats />, { wrapper: createWrapper() });
    expect(screen.getByText(/All/)).toBeInTheDocument();
    expect(screen.getByText(/Pending/)).toBeInTheDocument();
    expect(screen.getByText(/Active/)).toBeInTheDocument();
  });
});
