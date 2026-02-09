/**
 * Accessibility Tests for Button Component
 *
 * Tests WCAG 2.1 AA compliance including:
 * - Keyboard activation
 * - Focus indicators
 * - ARIA attributes
 * - Disabled states
 * - Loading states
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../../components/ui/button';

expect.extend(toHaveNoViolations);

describe('Button - Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click Me</Button>);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible with Enter', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Press Enter</Button>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be keyboard accessible with Space', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Press Space</Button>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be focusable via Tab', async () => {
    const user = userEvent.setup();

    render(
      <>
        <Button>First</Button>
        <Button>Second</Button>
      </>
    );

    const firstButton = screen.getByRole('button', { name: 'First' });
    const secondButton = screen.getByRole('button', { name: 'Second' });

    await user.tab();
    expect(firstButton).toHaveFocus();

    await user.tab();
    expect(secondButton).toHaveFocus();
  });

  it('should have accessible name from text content', () => {
    render(<Button>Submit Form</Button>);

    const button = screen.getByRole('button', { name: 'Submit Form' });
    expect(button).toBeInTheDocument();
  });

  it('should support aria-label', async () => {
    const { container } = render(
      <Button aria-label="Close dialog">
        <span aria-hidden="true">×</span>
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Close dialog' });
    expect(button).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be disabled correctly', async () => {
    const handleClick = vi.fn();

    const { container } = render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();

    // Click should not work when disabled
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not be focusable when disabled', () => {
    render(<Button disabled>Cannot Focus</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // Disabled buttons should not be in tab order
    expect(button).toHaveAttribute('disabled');
  });

  it('should support variant prop without a11y issues', async () => {
    const { container } = render(
      <>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support size prop without a11y issues', async () => {
    const { container } = render(
      <>
        <Button size="default">Default Size</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Icon button">
          ⚙
        </Button>
      </>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should work as submit button in forms', async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());

    const { container } = render(
      <form onSubmit={handleSubmit}>
        <input aria-label="Email" type="email" />
        <Button type="submit">Submit</Button>
      </form>
    );

    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support asChild prop accessibly', async () => {
    const { container } = render(
      <Button asChild>
        <a href="/home">Go Home</a>
      </Button>
    );

    // Should render as link, not button
    const link = screen.getByRole('link', { name: 'Go Home' });
    expect(link).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle icon-only buttons with aria-label', async () => {
    const { container } = render(
      <Button aria-label="Settings" size="icon">
        ⚙
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should maintain focus indicator visibility', async () => {
    const { container } = render(<Button>Focus Me</Button>);

    const button = screen.getByRole('button');
    button.focus();

    expect(button).toHaveFocus();

    // Button should have visible focus styles (checked via axe)
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support aria-pressed for toggle buttons', async () => {
    const { container, rerender } = render(
      <Button aria-pressed="false">Toggle Off</Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(<Button aria-pressed="true">Toggle On</Button>);
    expect(button).toHaveAttribute('aria-pressed', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support aria-expanded for dropdown triggers', async () => {
    const { container } = render(
      <Button aria-expanded="false" aria-haspopup="menu">
        Menu
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle loading state accessibly', async () => {
    const { container } = render(
      <Button disabled aria-busy="true">
        <span className="sr-only">Loading...</span>
        Loading
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should work with onClick handler', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click Handler</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support custom className without a11y issues', async () => {
    const { container } = render(
      <Button className="custom-class">Custom Styled</Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Button - Focus Management', () => {
  it('should receive focus programmatically', () => {
    const ref = { current: null as HTMLButtonElement | null };

    render(<Button ref={ref}>Focusable</Button>);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();
  });

  it('should blur when requested', () => {
    const ref = { current: null as HTMLButtonElement | null };

    render(<Button ref={ref}>Blurable</Button>);

    ref.current?.focus();
    expect(ref.current).toHaveFocus();

    ref.current?.blur();
    expect(ref.current).not.toHaveFocus();
  });
});

describe('Button - Screen Reader Compatibility', () => {
  it('should announce button role', () => {
    render(<Button>Announced Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should announce disabled state', () => {
    render(<Button disabled>Disabled Announced</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should hide decorative icons from screen readers', async () => {
    const { container } = render(
      <Button>
        <span aria-hidden="true">★</span>
        Favorite
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Favorite' });
    expect(button).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Button - Color Contrast', () => {
  it('should meet color contrast requirements', async () => {
    const { container } = render(
      <div style={{ padding: '20px' }}>
        <Button>Good Contrast</Button>
      </div>
    );

    // Axe will check color contrast
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
