import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({ data: {} }) },
}));

vi.mock('../components/hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    currentUser: { id: 'user-1', nickname: 'TestUser', bio: 'Hello', gender: 'MALE', interests: [] },
    isLoading: false,
    updateUser: vi.fn(),
  })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/profile/EditProfileImages', () => ({
  default: () => <div data-testid="edit-images">Images</div>,
}));

vi.mock('@/components/profile/EditProfileForm', () => ({
  default: () => <div data-testid="edit-form">Form</div>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import EditProfile from './EditProfile';

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

describe('EditProfile', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    const { container } = render(<EditProfile />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders the page heading', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('renders profile images editor', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-images')).toBeInTheDocument();
  });

  it('renders profile form', () => {
    render(<EditProfile />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();
  });
});
