import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StepAboutYou from './StepAboutYou';

vi.mock('@/components/onboarding/utils/onboardingUtils', () => ({
  TOTAL_STEPS: 14,
}));

const renderStepAboutYou = (props = {}) => {
  const defaultProps = {
    formData: {
      occupation: '',
      education: '',
      phone: '',
      bio: '',
      interests: [],
    },
    setFormData: vi.fn(),
    handleNext: vi.fn(),
  };

  const mergedProps = {
    ...defaultProps,
    ...props,
    formData: { ...defaultProps.formData, ...props.formData },
  };
  render(<StepAboutYou {...mergedProps} />);
  return mergedProps;
};

describe('[P1][onboarding] StepAboutYou interests input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes the interests text from existing formData interests', () => {
    renderStepAboutYou({ formData: { interests: ['Music', 'Travel'] } });

    expect(screen.getByText('Interests (comma separated)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Music, Art, Travel...')).toHaveValue('Music, Travel');
  });

  it('keeps comma-separated typing visible while saving trimmed interests as an array', () => {
    const props = renderStepAboutYou();
    const interestsInput = screen.getByPlaceholderText('Music, Art, Travel...');

    fireEvent.change(interestsInput, { target: { value: 'music, travel, cooking' } });

    expect(interestsInput).toHaveValue('music, travel, cooking');
    expect(props.setFormData).toHaveBeenCalledWith({
      ...props.formData,
      interests: ['music', 'travel', 'cooking'],
    });
  });
});
