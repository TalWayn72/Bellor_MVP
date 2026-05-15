import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePresence } from './usePresence';

const socketMocks = vi.hoisted(() => ({
  connect: vi.fn(),
  checkUsersOnline: vi.fn(),
  on: vi.fn(),
}));

vi.mock('../services/socketService', () => ({
  socketService: socketMocks,
}));

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketMocks.connect.mockResolvedValue({});
    socketMocks.on.mockReturnValue(vi.fn());
  });

  it('normalizes array presence check responses into online status map', async () => {
    socketMocks.checkUsersOnline.mockResolvedValue({
      success: true,
      data: [{ userId: 'user-2', isOnline: true, lastSeen: '2026-05-15T12:00:00.000Z' }],
    });

    const { result } = renderHook(() => usePresence(['user-2']));

    await waitFor(() => {
      expect(result.current.isOnline('user-2')).toBe(true);
    });
  });
});
