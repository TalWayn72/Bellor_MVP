/**
 * Toaster Component Test Suite
 * Verifies that the Toaster correctly filters non-DOM props (open, onOpenChange)
 * from toast objects before passing them to the Toast component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock useToast to control toast data
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({ toasts: [] })),
}));

import { useToast } from '@/components/ui/use-toast';
import { Toaster } from './toaster';

describe('[P0][ui] Toaster - non-DOM prop filtering', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue({ toasts: [] });
    // Capture console.error to detect React warnings about unknown props
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('should render toasts without passing open/onOpenChange to DOM', () => {
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-1',
          title: 'Test Toast',
          description: 'A test description',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'default',
        },
      ],
    });

    const { container } = render(<Toaster />);

    // No React warnings about unrecognized props should appear
    const reactPropWarnings = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        (call[0].includes('onOpenChange') || call[0].includes('open'))
    );
    expect(reactPropWarnings).toHaveLength(0);
  });

  it('should render toast title and description', () => {
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-2',
          title: 'Hello Title',
          description: 'Hello Description',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'default',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByText('Hello Title')).toBeInTheDocument();
    expect(screen.getByText('Hello Description')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-a',
          title: 'First Toast',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'default',
        },
        {
          id: 'toast-b',
          title: 'Second Toast',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'success',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByText('First Toast')).toBeInTheDocument();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
  });

  it('should render nothing when no toasts exist', () => {
    useToast.mockReturnValue({ toasts: [] });

    const { container } = render(<Toaster />);

    // Provider and Viewport containers exist, but no toast content
    expect(screen.queryByText('Toast')).not.toBeInTheDocument();
  });

  it('should handle toasts without title or description', () => {
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-minimal',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'info',
        },
      ],
    });

    // Should not throw
    expect(() => render(<Toaster />)).not.toThrow();
  });

  it('should NOT render toasts with open: false', () => {
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-open',
          title: 'Visible Toast',
          open: true,
          onOpenChange: vi.fn(),
          variant: 'default',
        },
        {
          id: 'toast-closed',
          title: 'Hidden Toast',
          open: false,
          onOpenChange: vi.fn(),
          variant: 'default',
        },
      ],
    });

    render(<Toaster />);

    expect(screen.getByText('Visible Toast')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Toast')).not.toBeInTheDocument();
  });

  it('should call onOpenChange(false) when close button is clicked', () => {
    const onOpenChangeSpy = vi.fn();
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-dismiss',
          title: 'Dismissable',
          open: true,
          onOpenChange: onOpenChangeSpy,
          variant: 'default',
        },
      ],
    });

    render(<Toaster />);

    // Find the close button (contains SVG X icon)
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg'));
    expect(closeBtn).toBeTruthy();

    fireEvent.click(closeBtn);
    expect(onOpenChangeSpy).toHaveBeenCalledWith(false);
  });

  it('should destructure open and onOpenChange away from DOM props', () => {
    const onOpenChangeSpy = vi.fn();
    useToast.mockReturnValue({
      toasts: [
        {
          id: 'toast-filter',
          title: 'Filtered',
          open: true,
          onOpenChange: onOpenChangeSpy,
          variant: 'default',
        },
      ],
    });

    render(<Toaster />);

    // The onOpenChange function should NOT have been called by the render
    // (it's only called when a toast is dismissed, not during mount)
    expect(onOpenChangeSpy).not.toHaveBeenCalled();

    // No unknown-prop warnings from React
    const unknownPropWarnings = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === 'string' &&
        call[0].includes('Unknown event handler')
    );
    expect(unknownPropWarnings).toHaveLength(0);
  });
});
