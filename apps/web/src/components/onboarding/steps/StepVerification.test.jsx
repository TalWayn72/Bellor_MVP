import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StepVerification from './StepVerification';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/onboarding/utils/onboardingUtils', () => ({
  TOTAL_STEPS: 14,
}));

const fixedNow = new Date('2026-05-11T12:00:00.000Z');
const expectedSkipUntil = '2026-05-14T12:00:00.000Z';

const renderStepVerification = (props = {}) => {
  const defaultProps = {
    formData: { gender: 'female', verification_skip_until: null },
    setFormData: vi.fn(),
    handleNext: vi.fn(),
    handleBack: vi.fn(),
    subStep: 10,
  };

  const mergedProps = { ...defaultProps, ...props };
  render(<StepVerification {...mergedProps} />);
  return mergedProps;
};

describe('[P0][onboarding] StepVerification skip flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('SKIP IT on the intro screen skips forward without going back', () => {
    const props = renderStepVerification({ subStep: 10 });

    fireEvent.click(screen.getByRole('button', { name: /skip it/i }));

    expect(props.handleBack).not.toHaveBeenCalled();
    expect(props.handleNext).toHaveBeenCalledTimes(1);
    expect(props.setFormData).toHaveBeenCalledWith({
      ...props.formData,
      verification_skip_until: expectedSkipUntil,
    });
  });

  it('SKIP on the camera screen applies the same 72-hour skip and continues', () => {
    const props = renderStepVerification({ subStep: 9 });

    fireEvent.click(screen.getByRole('button', { name: /^skip$/i }));

    expect(props.handleBack).not.toHaveBeenCalled();
    expect(props.handleNext).toHaveBeenCalledTimes(1);
    expect(props.setFormData).toHaveBeenCalledWith({
      ...props.formData,
      verification_skip_until: expectedSkipUntil,
    });
  });
});
