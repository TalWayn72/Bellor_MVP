import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StepGender from './StepGender';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('@/components/onboarding/utils/onboardingUtils', () => ({
  TOTAL_STEPS: 14,
}));

vi.mock('@/utils', () => ({
  createPageUrl: (page) => `/${page}`,
}));

const renderStepGender = (props = {}) => {
  const defaultProps = {
    formData: {},
    setFormData: vi.fn(),
    handleNext: vi.fn(),
    subStep: 7,
  };

  const mergedProps = { ...defaultProps, ...props };
  render(<StepGender {...mergedProps} />);
  return mergedProps;
};

describe('[P0][onboarding] StepGender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows only supported top-level gender options', () => {
    renderStepGender();

    expect(screen.getByRole('button', { name: /^female$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^male$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^other$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /prefer not to say/i })).not.toBeInTheDocument();
  });

  it('preserves FEMALE and MALE selection flow', () => {
    const props = renderStepGender({ formData: { nickname: 'Riley' } });

    fireEvent.click(screen.getByRole('button', { name: /^female$/i }));
    expect(props.setFormData).toHaveBeenCalledWith({ nickname: 'Riley', gender: 'female' });
    expect(navigate).toHaveBeenLastCalledWith('/Onboarding?step=7.7');

    fireEvent.click(screen.getByRole('button', { name: /^male$/i }));
    expect(props.setFormData).toHaveBeenCalledWith({ nickname: 'Riley', gender: 'male' });
    expect(navigate).toHaveBeenLastCalledWith('/Onboarding?step=7.7');
  });

  it('keeps top-level OTHER navigation to the other-options substep', () => {
    renderStepGender();

    fireEvent.click(screen.getByRole('button', { name: /^other$/i }));

    expect(navigate).toHaveBeenCalledWith('/Onboarding?step=7.5');
  });

  it('removes redundant choices from Other Options while preserving remaining option behavior', () => {
    const props = renderStepGender({ formData: { nickname: 'Riley' }, subStep: 7.5 });

    expect(screen.queryByRole('button', { name: /^male$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^other$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /genderqueer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /non-binary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /questioning/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /non-binary/i }));

    expect(props.setFormData).toHaveBeenCalledWith({
      nickname: 'Riley',
      gender: 'other',
      gender_other: 'NON-BINARY',
    });
    expect(navigate).toHaveBeenCalledWith('/Onboarding?step=7.7');
  });
});
