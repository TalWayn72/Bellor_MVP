import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api', () => ({
  userService: { updateUser: vi.fn().mockResolvedValue({}) },
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, isAuthenticated: false })),
}));

vi.mock('@/components/navigation/BackButton', () => ({
  default: () => <div data-testid="back-button">Back</div>,
}));

vi.mock('@/components/onboarding/utils/onboardingUtils', () => ({
  formatDateForInput: vi.fn(() => ''),
  validateDateOfBirth: vi.fn(() => ({ isValid: true })),
  TOTAL_STEPS: 14,
}));

vi.mock('@/components/onboarding/steps/StepSplash', () => ({ default: () => <div data-testid="step-splash">Splash</div> }));
vi.mock('@/components/onboarding/steps/StepWelcome', () => ({ default: () => <div data-testid="step-welcome">Welcome</div> }));
vi.mock('@/components/onboarding/steps/StepAuth', () => ({ default: () => <div data-testid="step-auth">Auth</div> }));
vi.mock('@/components/onboarding/steps/StepPhoneLogin', () => ({ default: () => <div data-testid="step-phone">Phone</div> }));
vi.mock('@/components/onboarding/steps/StepPhoneVerify', () => ({ default: () => <div data-testid="step-verify">Verify</div> }));
vi.mock('@/components/onboarding/steps/StepNickname', () => ({ default: () => <div data-testid="step-nickname">Nickname</div> }));
vi.mock('@/components/onboarding/steps/StepBirthDate', () => ({ default: () => <div data-testid="step-birth">Birth</div> }));
vi.mock('@/components/onboarding/steps/StepLocation', () => ({ default: () => <div data-testid="step-location">Location</div> }));
vi.mock('@/components/onboarding/steps/StepAboutYou', () => ({ default: () => <div data-testid="step-about">About</div> }));
vi.mock('@/components/onboarding/steps/StepGender', () => ({ default: () => <div data-testid="step-gender">Gender</div> }));
vi.mock('@/components/onboarding/steps/StepPhotos', () => ({ default: () => <div data-testid="step-photos">Photos</div> }));
vi.mock('@/components/onboarding/steps/StepVerification', () => ({ default: () => <div data-testid="step-verification">Verification</div> }));
vi.mock('@/components/onboarding/steps/StepSketchMode', () => ({ default: () => <div data-testid="step-sketch">Sketch</div> }));
vi.mock('@/components/onboarding/steps/StepDrawing', () => ({ default: () => <div data-testid="step-drawing">Drawing</div> }));
vi.mock('@/components/onboarding/steps/StepFirstQuestion', () => ({ default: () => <div data-testid="step-question">Question</div> }));

vi.mock('../components/providers/ThemeProvider', () => ({
  useTheme: vi.fn(() => ({})),
}));

import Onboarding from './Onboarding';

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

const createMemoryWrapper = (initialEntries = ['/Onboarding']) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('[P0][auth] Onboarding', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });

  afterEach(() => { vi.useRealTimers(); });

  it('renders without crashing', () => {
    const { container } = render(<Onboarding />, { wrapper: createWrapper() });
    expect(container).toBeDefined();
  });

  it('renders splash step by default (step 0)', () => {
    const { getByTestId } = render(<Onboarding />, { wrapper: createWrapper() });
    expect(getByTestId('step-splash')).toBeInTheDocument();
  });

  describe('race condition prevention (useSearchParams)', () => {
    it('renders correct step from URL search params', () => {
      const { getByTestId } = render(<Onboarding />, {
        wrapper: createMemoryWrapper(['/Onboarding?step=1']),
      });
      expect(getByTestId('step-welcome')).toBeInTheDocument();
    });

    it('renders step 14 from URL search params', () => {
      const { getByTestId } = render(<Onboarding />, {
        wrapper: createMemoryWrapper(['/Onboarding?step=14']),
      });
      expect(getByTestId('step-question')).toBeInTheDocument();
    });

    it('step 0 auto-redirect timer is cleaned up on unmount', () => {
      const { unmount, getByTestId } = render(<Onboarding />, {
        wrapper: createMemoryWrapper(['/Onboarding']),
      });
      expect(getByTestId('step-splash')).toBeInTheDocument();

      // Unmount before timer fires (1.5s) - should NOT throw
      unmount();
      vi.advanceTimersByTime(2000);
    });
  });
});
