import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: null, isLoading: false })),
  };
});

// Mock API services
vi.mock('@/api', () => ({
  likeService: {
    getResponseLikes: vi.fn(() => Promise.resolve({ likes: [] })),
    likeUser: vi.fn(() => Promise.resolve({})),
  },
  userService: {
    getUserById: vi.fn(() => Promise.resolve(null)),
  },
}));

// Mock createPageUrl
vi.mock('@/utils', () => ({
  createPageUrl: vi.fn((page) => `/${page}`),
}));
