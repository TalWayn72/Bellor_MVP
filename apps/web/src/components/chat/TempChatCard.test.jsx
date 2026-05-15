import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TempChatCard from './TempChatCard';

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('TempChatCard', () => {
  const renderCard = (otherUser) => render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TempChatCard
        chat={{
          id: 'chat-118',
          status: 'active',
          expires_at: futureDate(),
          other_user: otherUser,
        }}
        onAvatarClick={vi.fn()}
      />
    </MemoryRouter>,
  );

  it.each([
    ['first_name', { id: 'user-118', first_name: 'Maya', profile_images: [] }, 'Maya'],
    ['firstName', { id: 'user-118', firstName: 'Dana', profile_images: [] }, 'Dana'],
    ['nickname', { id: 'user-118', nickname: 'Novi', profile_images: [] }, 'Novi'],
    ['name', { id: 'user-118', name: 'Ari', profile_images: [] }, 'Ari'],
  ])('shows the other user name from snake_case transformed chat payloads using %s', (_field, otherUser, name) => {
    renderCard(otherUser);

    expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.queryByText('Unknown user')).not.toBeInTheDocument();
  });

  it('still supports the existing camelCase otherUser payload shape', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TempChatCard
          chat={{
            id: 'chat-118',
            status: 'active',
            expires_at: futureDate(),
            otherUser: {
              id: 'user-118',
              first_name: 'Maya',
              profile_images: [],
            },
          }}
          onAvatarClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Maya')).toBeInTheDocument();
  });
});
