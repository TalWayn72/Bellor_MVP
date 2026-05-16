import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSharedSpaceData } from './useSharedSpaceData';

const mockGetChats = vi.fn();

vi.mock('@/api', () => ({
  missionService: {
    getTodaysMission: vi.fn().mockResolvedValue({ data: null }),
    listMissions: vi.fn().mockResolvedValue({ data: [] }),
  },
  responseService: {
    listResponses: vi.fn().mockResolvedValue({ data: [] }),
    getMyResponses: vi.fn().mockResolvedValue({ data: [] }),
  },
  chatService: {
    getChats: (...args) => mockGetChats(...args),
  },
}));

vi.mock('@/data/demoData', () => ({
  getDemoResponses: vi.fn(() => []),
  getDemoChatUsers: vi.fn(() => []),
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useSharedSpaceData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps snake_case chat peer metadata with camelCase user fields into active chat users', async () => {
    mockGetChats.mockResolvedValue({
      chats: [
        {
          id: 'chat-1',
          other_user: {
            id: 'user-2',
            firstName: 'Dana',
            profileImages: ['https://example.com/dana.jpg'],
          },
        },
      ],
    });

    const { result } = renderHook(() => useSharedSpaceData({ id: 'user-1' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.activeChatUsers).toEqual([
        {
          chatId: 'chat-1',
          userId: 'user-2',
          name: 'Dana',
          image: 'https://example.com/dana.jpg',
          isOnline: false,
        },
      ]);
    });
  });
});
