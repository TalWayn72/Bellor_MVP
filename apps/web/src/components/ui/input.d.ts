import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

declare const inputVariants: (props?: {
  variant?: 'default' | 'filled' | 'outline' | 'ghost' | null;
  inputSize?: 'default' | 'sm' | 'lg' | null;
  class?: string;
  className?: string;
}) => string;

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

declare const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>;

export interface InputWithIconProps extends InputProps {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

declare const InputWithIcon: React.ForwardRefExoticComponent<
  InputWithIconProps & React.RefAttributes<HTMLInputElement>
>;

export { Input, InputWithIcon, inputVariants };
