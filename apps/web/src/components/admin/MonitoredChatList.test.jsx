import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MonitoredChatList from './MonitoredChatList';

vi.mock('@/utils', () => ({
  createPageUrl: (path) => `/${path}`,
}));

describe('MonitoredChatList', () => {
  it('renders the other user id from snake_case chat metadata', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MonitoredChatList
          isLoading={false}
          chats={[
            {
              id: 'chat-1',
              other_user: { id: 'user-222222' },
              is_permanent: true,
              status: 'active',
              reported_count: 0,
              created_date: '2026-05-14T10:00:00Z',
            },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/user-222\.\.\./)).toBeInTheDocument();
    expect(screen.queryByText(/\?\.\.\./)).not.toBeInTheDocument();
  });
});
