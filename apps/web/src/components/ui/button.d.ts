import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'love'
    | 'match'
    | 'premium'
    | 'success'
    | 'soft'
    | null;
  size?:
    | 'default'
    | 'sm'
    | 'lg'
    | 'xl'
    | 'icon'
    | 'icon-sm'
    | 'icon-lg'
    | null;
  class?: string;
  className?: string;
}) => string;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

export { Button, buttonVariants };
