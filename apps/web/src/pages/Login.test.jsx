import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    register: mockRegister,
    isLoadingAuth: false,
  })),
}));

vi.mock('@/api/client/apiClient', () => ({
  apiClient: { get: vi.fn().mockResolvedValue({ data: { data: { google: false } } }) },
}));

vi.mock('@/components/auth/GoogleIcon', () => ({
  default: () => <span data-testid="google-icon">G</span>,
}));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Login from './Login';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/api/client/apiClient';

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

const createMemoryWrapper = (initialEntries = ['/login']) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
    mockRegister.mockReset();
    mockNavigate.mockReset();
    apiClient.get.mockResolvedValue({ data: { data: { google: false } } });
    useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      isLoadingAuth: false,
    });
  });

  // --- Existing scaffold tests (preserved) ---

  it('renders without crashing', () => {
    const { container } = render(<Login />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders welcome back heading', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders guest login option', () => {
    render(<Login />, { wrapper: createWrapper() });
    expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
  });

  // --- New behavioral tests ---

  describe('form inputs display', () => {
    it('should display email and password inputs with labels', () => {
      render(<Login />, { wrapper: createWrapper() });
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should have email input of type email', () => {
      render(<Login />, { wrapper: createWrapper() });
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password input of type password by default', () => {
      render(<Login />, { wrapper: createWrapper() });
      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('form validation', () => {
    it('should show validation for empty email on submit via native required', () => {
      render(<Login />, { wrapper: createWrapper() });
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toBeRequired();
    });

    it('should enforce email type validation via type=email attribute', () => {
      render(<Login />, { wrapper: createWrapper() });
      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should enforce minimum password length via minLength attribute', () => {
      render(<Login />, { wrapper: createWrapper() });
      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('should mark password as required', () => {
      render(<Login />, { wrapper: createWrapper() });
      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toBeRequired();
    });
  });

  describe('form submission', () => {
    it('should call login function on form submit with correct data', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      render(<Login />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123!');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Password123!',
        });
      });
    });

    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        response: { data: { error: { message: 'Invalid credentials' } } },
      });

      render(<Login />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'WrongPassword1!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should display generic error when login fails without message', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Network error'));

      render(<Login />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should redirect to home on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      render(<Login />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Home');
      });
    });

    it('should redirect to returnUrl on successful login when provided', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({});

      render(<Login />, {
        wrapper: createMemoryWrapper(['/login?returnUrl=/Profile']),
      });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/Profile');
      });
    });
  });

  describe('loading state', () => {
    it('should disable submit button while loading', () => {
      useAuth.mockReturnValue({
        login: mockLogin,
        register: mockRegister,
        isLoadingAuth: true,
      });

      const { container } = render(<Login />, { wrapper: createWrapper() });

      // When loading, the submit button is disabled and shows a spinner
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('mode toggle (login/register)', () => {
    it('should have a link/button to register', () => {
      render(<Login />, { wrapper: createWrapper() });
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should toggle to register mode when "Sign up" is clicked', async () => {
      const user = userEvent.setup();
      render(<Login />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // The heading should change to "Create Account"
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create Account');
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });

    it('should toggle back to login mode when "Sign in" is clicked from register', async () => {
      const user = userEvent.setup();
      render(<Login />, { wrapper: createWrapper() });

      // Switch to register
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create Account');

      // Switch back to login
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Welcome Back');
    });

    it('should call register function when submitting in register mode', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({});

      render(<Login />, { wrapper: createWrapper() });

      // Switch to register mode
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email'), 'john@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');

      // The submit button in register mode says "Create Account"
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
            password: 'Password123!',
            firstName: 'John',
            lastName: 'Doe',
          })
        );
      });
    });

    it('should clear error when toggling mode', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        response: { data: { error: { message: 'Login failed' } } },
      });

      render(<Login />, { wrapper: createWrapper() });

      // Trigger login error
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      // Toggle to register mode should clear the error
      await user.click(screen.getByRole('button', { name: /sign up/i }));
      expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
    });
  });

  describe('Google OAuth button', () => {
    it('should display Google OAuth button when Google is enabled', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { google: true } } });

      render(<Login />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      });
    });

    it('should not display Google OAuth button when Google is disabled', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { google: false } } });

      render(<Login />, { wrapper: createWrapper() });

      // Wait for the async effect to complete
      await waitFor(() => {
        expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
      });
    });

    it('should not display Google OAuth button when status check fails', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      render(<Login />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
      });
    });
  });

  describe('OAuth error from URL params', () => {
    it('should display error when oauth_denied error param is present', async () => {
      render(<Login />, {
        wrapper: createMemoryWrapper(['/login?error=oauth_denied']),
      });

      await waitFor(() => {
        expect(screen.getByText('Login was cancelled')).toBeInTheDocument();
      });
    });

    it('should display error when oauth_failed error param is present', async () => {
      render(<Login />, {
        wrapper: createMemoryWrapper(['/login?error=oauth_failed']),
      });

      await waitFor(() => {
        expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown error param', async () => {
      render(<Login />, {
        wrapper: createMemoryWrapper(['/login?error=unknown_error']),
      });

      await waitFor(() => {
        expect(screen.getByText('An error occurred during login')).toBeInTheDocument();
      });
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<Login />, { wrapper: createWrapper() });

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the toggle button (the button inside the password field container)
      const toggleButtons = screen.getAllByRole('button');
      const toggleBtn = toggleButtons.find(
        (btn) => btn.querySelector('.lucide-eye') || btn.querySelector('.lucide-eye-off') || btn.closest('.relative')?.querySelector('[name="password"]')
      );

      // Click the toggle button next to password
      // The toggle is a button element inside the relative container
      const passwordContainer = passwordInput.closest('.relative');
      const eyeButton = passwordContainer.querySelector('button');
      await user.click(eyeButton);

      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await user.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('error clearing on input change', () => {
    it('should clear error message when user types in any field', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue({
        response: { data: { error: { message: 'Bad credentials' } } },
      });

      render(<Login />, { wrapper: createWrapper() });

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Bad credentials')).toBeInTheDocument();
      });

      // Typing in a field should clear the error
      await user.type(screen.getByLabelText('Email'), 'x');
      expect(screen.queryByText('Bad credentials')).not.toBeInTheDocument();
    });
  });
});
