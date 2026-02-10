import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('./DrawerMenuItems', () => ({
  menuItems: [
    { icon: <span>icon</span>, label: 'Test Item', path: 'TestPage' },
  ],
}));

vi.mock('@/utils', () => ({
  createPageUrl: vi.fn((path) => `/${path}`),
  formatLocation: vi.fn((loc) => {
    if (!loc) return 'Unknown';
    if (typeof loc === 'string') return loc;
    return [loc.city, loc.country].filter(Boolean).join(', ');
  }),
}));

import DrawerMenu from './DrawerMenu';

const wrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {children}
  </BrowserRouter>
);

describe('[P2][infra] DrawerMenu', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <DrawerMenu isOpen={false} onClose={vi.fn()} currentUser={null} />,
      { wrapper }
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders menu when isOpen is true', () => {
    render(
      <DrawerMenu isOpen={true} onClose={vi.fn()} currentUser={{
        id: '1', nickname: 'TestUser', age: 25, location: 'Tel Aviv', profile_images: [],
      }} />,
      { wrapper }
    );
    expect(screen.getByText(/TestUser/)).toBeInTheDocument();
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('handles location as object without crashing', () => {
    render(
      <DrawerMenu isOpen={true} onClose={vi.fn()} currentUser={{
        id: '1', nickname: 'User', age: 30,
        location: { city: 'Jerusalem', country: 'Israel' },
        profile_images: [],
      }} />,
      { wrapper }
    );
    expect(screen.getByText('Jerusalem, Israel')).toBeInTheDocument();
  });

  it('handles location as string', () => {
    render(
      <DrawerMenu isOpen={true} onClose={vi.fn()} currentUser={{
        id: '1', nickname: 'User', age: 30, location: 'Haifa', profile_images: [],
      }} />,
      { wrapper }
    );
    expect(screen.getByText('Haifa')).toBeInTheDocument();
  });

  it('handles null location gracefully', () => {
    render(
      <DrawerMenu isOpen={true} onClose={vi.fn()} currentUser={{
        id: '1', nickname: 'User', age: 30, location: null, profile_images: [],
      }} />,
      { wrapper }
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('uses fallback user when currentUser is null', () => {
    render(
      <DrawerMenu isOpen={true} onClose={vi.fn()} currentUser={null} />,
      { wrapper }
    );
    expect(screen.getByText(/Guest/)).toBeInTheDocument();
  });
});
