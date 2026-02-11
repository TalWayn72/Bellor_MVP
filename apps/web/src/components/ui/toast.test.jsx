/**
 * Toast Component Test Suite
 * Verifies that non-DOM props (open, onOpenChange) are NOT passed to
 * the underlying HTML element, preventing React warnings.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Toast, ToastProvider, ToastTitle, ToastDescription } from './toast';

describe('[P0][ui] Toast - DOM prop filtering', () => {
  it('should NOT pass onOpenChange to the rendered DOM element', () => {
    const { container } = render(
      <Toast onOpenChange={() => {}} variant="default">
        Hello
      </Toast>
    );

    const toastDiv = container.firstChild;
    expect(toastDiv).toBeTruthy();
    expect(toastDiv.getAttribute('onOpenChange')).toBeNull();
    expect(toastDiv.getAttribute('onopenchange')).toBeNull();
  });

  it('should NOT pass open to the rendered DOM element', () => {
    const { container } = render(
      <Toast open={true} variant="default">
        Hello
      </Toast>
    );

    const toastDiv = container.firstChild;
    expect(toastDiv).toBeTruthy();
    expect(toastDiv.getAttribute('open')).toBeNull();
  });

  it('should NOT pass either open or onOpenChange to the DOM', () => {
    const { container } = render(
      <Toast onOpenChange={() => {}} open={true} variant="default">
        Hello
      </Toast>
    );

    const toastDiv = container.firstChild;
    expect(toastDiv).toBeTruthy();
    expect(toastDiv.getAttribute('open')).toBeNull();
    expect(toastDiv.getAttribute('onOpenChange')).toBeNull();
    expect(toastDiv.getAttribute('onopenchange')).toBeNull();
  });

  it('should still render children correctly', () => {
    render(
      <Toast onOpenChange={() => {}} open={true} variant="default">
        <span data-testid="toast-child">Toast Content</span>
      </Toast>
    );

    expect(screen.getByTestId('toast-child')).toBeInTheDocument();
    expect(screen.getByText('Toast Content')).toBeInTheDocument();
  });

  it('should render with the correct variant class', () => {
    const { container } = render(
      <Toast variant="success" open={true} onOpenChange={() => {}}>
        Success!
      </Toast>
    );

    const toastDiv = container.firstChild;
    expect(toastDiv.className).toContain('success');
  });

  it('should forward valid HTML props to the DOM element', () => {
    const { container } = render(
      <Toast
        data-testid="my-toast"
        role="alert"
        open={true}
        onOpenChange={() => {}}
        variant="default"
      >
        Alert toast
      </Toast>
    );

    const toastDiv = container.firstChild;
    expect(toastDiv.getAttribute('data-testid')).toBe('my-toast');
    expect(toastDiv.getAttribute('role')).toBe('alert');
  });
});

describe('[P0][ui] Toast - sub-components', () => {
  it('should render ToastTitle with text', () => {
    render(<ToastTitle data-testid="title">My Title</ToastTitle>);
    expect(screen.getByTestId('title')).toHaveTextContent('My Title');
  });

  it('should render ToastDescription with text', () => {
    render(
      <ToastDescription data-testid="desc">My Description</ToastDescription>
    );
    expect(screen.getByTestId('desc')).toHaveTextContent('My Description');
  });

  it('should render ToastProvider with children', () => {
    render(
      <ToastProvider>
        <div data-testid="provider-child">Inside Provider</div>
      </ToastProvider>
    );
    expect(screen.getByTestId('provider-child')).toBeInTheDocument();
  });
});
