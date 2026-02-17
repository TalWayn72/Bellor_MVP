/**
 * Accessibility Tests for SecureTextInput Component
 *
 * Tests WCAG 2.1 AA compliance including:
 * - Proper labeling
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Error states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SecureTextInput } from '../../../components/secure/SecureTextInput';

expect.extend(toHaveNoViolations);

describe('SecureTextInput - Accessibility', () => {
  it('should have no accessibility violations with label', async () => {
    const { container } = render(
      <label htmlFor="test-input">
        Email Address
        <SecureTextInput id="test-input" placeholder="Enter email" />
      </label>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with aria-label', async () => {
    const { container } = render(
      <SecureTextInput aria-label="Email Address" placeholder="Enter email" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <SecureTextInput
        aria-label="Username"
        aria-required="true"
        aria-describedby="username-help"
      />
    );

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'username-help');
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SecureTextInput aria-label="First name" />
        <SecureTextInput aria-label="Last name" />
      </>
    );

    // Tab to first input
    await user.tab();
    const firstInput = screen.getByLabelText('First name');
    expect(firstInput).toHaveFocus();

    // Tab to second input
    await user.tab();
    const secondInput = screen.getByLabelText('Last name');
    expect(secondInput).toHaveFocus();
  });

  it('should have accessible name from label', () => {
    render(
      <label htmlFor="email-input">
        Email
        <SecureTextInput id="email-input" />
      </label>
    );

    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('should support required attribute with proper ARIA', async () => {
    const { container } = render(
      <SecureTextInput aria-label="Password" required aria-required="true" />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-required', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible error state', async () => {
    const { container } = render(
      <SecureTextInput
        aria-label="Email"
        aria-invalid="true"
        aria-describedby="email-error"
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations with character counter', async () => {
    const { container } = render(
      <SecureTextInput
        aria-label="Message"
        showCharCount={true}
        fieldType="message"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should maintain accessibility with disabled state', async () => {
    const { container } = render(
      <SecureTextInput aria-label="Disabled Input" disabled />
    );

    const input = screen.getByLabelText('Disabled Input');
    expect(input).toBeDisabled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible placeholder text', async () => {
    const { container } = render(
      <SecureTextInput
        aria-label="Search"
        placeholder="Type to search..."
      />
    );

    const input = screen.getByLabelText('Search');
    expect(input).toHaveAttribute('placeholder', 'Type to search...');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support autocomplete with accessibility', async () => {
    const { container } = render(
      <SecureTextInput
        aria-label="Email"
        autoComplete="email"
        type="email"
      />
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('autocomplete', 'email');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible with read-only state', async () => {
    const { container } = render(
      <SecureTextInput
        aria-label="Read-only Field"
        readOnly
        value="Cannot edit this"
      />
    );

    const input = screen.getByLabelText('Read-only Field');
    expect(input).toHaveAttribute('readonly');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations with all props combined', async () => {
    const { container } = render(
      <div>
        <label htmlFor="complete-input">Full Name</label>
        <SecureTextInput
          id="complete-input"
          aria-label="Full Name"
          aria-required="true"
          aria-describedby="name-help"
          placeholder="John Doe"
          required
          showCharCount={true}
        />
        <span id="name-help">Enter your full legal name</span>
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should handle focus events accessibly', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
      <SecureTextInput
        aria-label="Test Input"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );

    const input = screen.getByLabelText('Test Input');

    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should work with form context', async () => {
    const { container } = render(
      <form aria-label="Contact Form">
        <label htmlFor="name">Name</label>
        <SecureTextInput id="name" name="fullName" />

        <label htmlFor="email">Email</label>
        <SecureTextInput id="email" name="email" type="email" />
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('SecureTextInput - Keyboard Interactions', () => {
  it('should support standard keyboard input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SecureTextInput
        aria-label="Text Input"
        onSecureChange={handleChange}
      />
    );

    const input = screen.getByLabelText('Text Input');
    await user.type(input, 'Hello');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support keyboard shortcuts', async () => {
    const user = userEvent.setup();

    render(<SecureTextInput aria-label="Shortcut Test" />);

    const input = screen.getByLabelText('Shortcut Test') as HTMLInputElement;
    await user.type(input, 'Some text');

    // Select all (Ctrl+A)
    await user.keyboard('{Control>}a{/Control}');

    // Should have selection
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('should support arrow key navigation', async () => {
    const user = userEvent.setup();

    render(<SecureTextInput aria-label="Arrow Test" value="Test" />);

    const input = screen.getByLabelText('Arrow Test') as HTMLInputElement;
    await user.click(input);

    // Move to end
    await user.keyboard('{End}');
    expect(input.selectionStart).toBe(4);

    // Move to start
    await user.keyboard('{Home}');
    expect(input.selectionStart).toBe(0);
  });
});
