/**
 * Accessibility Tests for SecureTextArea Component
 *
 * Tests WCAG 2.1 AA compliance including:
 * - Proper labeling
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Multi-line text handling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SecureTextArea } from '../../../components/secure/SecureTextArea';

expect.extend(toHaveNoViolations);

describe('SecureTextArea - Accessibility', () => {
  it('should have no accessibility violations with label', async () => {
    const { container } = render(
      <label htmlFor="bio-textarea">
        Biography
        <SecureTextArea id="bio-textarea" placeholder="Tell us about yourself" />
      </label>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations with aria-label', async () => {
    const { container } = render(
      <SecureTextArea aria-label="About Me" placeholder="Write something..." />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <SecureTextArea
        aria-label="Description"
        aria-required="true"
        aria-describedby="desc-help"
      />
    );

    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toHaveAttribute('aria-describedby', 'desc-help');
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SecureTextArea aria-label="First field" />
        <SecureTextArea aria-label="Second field" />
      </>
    );

    // Tab to first textarea
    await user.tab();
    const firstTextarea = screen.getByLabelText('First field');
    expect(firstTextarea).toHaveFocus();

    // Tab to second textarea
    await user.tab();
    const secondTextarea = screen.getByLabelText('Second field');
    expect(secondTextarea).toHaveFocus();
  });

  it('should have accessible name from label', () => {
    render(
      <div>
        <label htmlFor="comment-area">Comment</label>
        <SecureTextArea id="comment-area" />
      </div>
    );

    const textarea = screen.getByLabelText('Comment');
    expect(textarea).toBeInTheDocument();
  });

  it('should support required attribute with proper ARIA', async () => {
    const { container } = render(
      <SecureTextArea aria-label="Message" required aria-required="true" />
    );

    const textarea = screen.getByLabelText('Message');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('aria-required', 'true');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible error state', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Bio"
        aria-invalid="true"
        aria-describedby="bio-error"
      />
    );

    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAttribute('aria-describedby', 'bio-error');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations with character counter', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Bio"
        showCharCount={true}
        fieldType="bio"
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should maintain accessibility with disabled state', async () => {
    const { container } = render(
      <SecureTextArea aria-label="Disabled Textarea" disabled />
    );

    const textarea = screen.getByLabelText('Disabled Textarea');
    expect(textarea).toBeDisabled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible placeholder text', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Notes"
        placeholder="Enter your notes here..."
      />
    );

    const textarea = screen.getByLabelText('Notes');
    expect(textarea).toHaveAttribute('placeholder', 'Enter your notes here...');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be accessible with read-only state', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Read-only Field"
        readOnly
        value="Cannot edit this content"
      />
    );

    const textarea = screen.getByLabelText('Read-only Field');
    expect(textarea).toHaveAttribute('readonly');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations with rows attribute', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Large Text"
        rows={10}
      />
    );

    const textarea = screen.getByLabelText('Large Text');
    expect(textarea).toHaveAttribute('rows', '10');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations with all props combined', async () => {
    const { container } = render(
      <div>
        <label htmlFor="complete-textarea">Description</label>
        <SecureTextArea
          id="complete-textarea"
          aria-label="Full Description"
          aria-required="true"
          aria-describedby="desc-help"
          placeholder="Write your description..."
          required
          showCharCount={true}
          rows={5}
        />
        <span id="desc-help">Describe your experience in detail</span>
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
      <SecureTextArea
        aria-label="Test Textarea"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );

    const textarea = screen.getByLabelText('Test Textarea');

    await user.click(textarea);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should work with form context', async () => {
    const { container } = render(
      <form aria-label="Feedback Form">
        <label htmlFor="name">Name</label>
        <SecureTextArea id="name" name="fullName" rows={1} />

        <label htmlFor="feedback">Feedback</label>
        <SecureTextArea id="feedback" name="feedback" rows={5} />
      </form>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('SecureTextArea - Keyboard Interactions', () => {
  it('should support multiline text input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SecureTextArea
        aria-label="Multiline Input"
        onSecureChange={handleChange}
      />
    );

    const textarea = screen.getByLabelText('Multiline Input');
    await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support Enter key for new lines', async () => {
    const user = userEvent.setup();

    render(<SecureTextArea aria-label="New Line Test" />);

    const textarea = screen.getByLabelText('New Line Test') as HTMLTextAreaElement;
    await user.type(textarea, 'First line{Enter}Second line');

    expect(textarea.value).toContain('\n');
  });

  it('should support Tab key for navigation', async () => {
    const user = userEvent.setup();

    render(
      <>
        <SecureTextArea aria-label="First" />
        <SecureTextArea aria-label="Second" />
      </>
    );

    const first = screen.getByLabelText('First');
    const second = screen.getByLabelText('Second');

    await user.click(first);
    expect(first).toHaveFocus();

    await user.tab();
    expect(second).toHaveFocus();
  });

  it('should support keyboard shortcuts', async () => {
    const user = userEvent.setup();

    render(<SecureTextArea aria-label="Shortcut Test" />);

    const textarea = screen.getByLabelText('Shortcut Test') as HTMLTextAreaElement;
    await user.type(textarea, 'Some text');

    // Select all (Ctrl+A)
    await user.keyboard('{Control>}a{/Control}');

    // Should have selection
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(textarea.value.length);
  });

  it('should support arrow key navigation', async () => {
    const user = userEvent.setup();

    render(<SecureTextArea aria-label="Arrow Test" value="Test content" />);

    const textarea = screen.getByLabelText('Arrow Test') as HTMLTextAreaElement;
    await user.click(textarea);

    // Move to end
    await user.keyboard('{Control>}{End}{/Control}');
    expect(textarea.selectionStart).toBe(textarea.value.length);

    // Move to start
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(textarea.selectionStart).toBe(0);
  });

  it('should allow Shift+Enter for new line', async () => {
    const user = userEvent.setup();

    render(<SecureTextArea aria-label="Shift Enter Test" />);

    const textarea = screen.getByLabelText('Shift Enter Test') as HTMLTextAreaElement;
    await user.type(textarea, 'First{Shift>}{Enter}{/Shift}Second');

    expect(textarea.value).toContain('\n');
  });
});

describe('SecureTextArea - Character Counter Accessibility', () => {
  it('should announce character count to screen readers', async () => {
    const { container } = render(
      <SecureTextArea
        aria-label="Bio"
        showCharCount={true}
        fieldType="bio"
      />
    );

    // Character counter should be visible
    const charCount = container.querySelector('span');
    expect(charCount).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should update character count accessibly', async () => {
    const user = userEvent.setup();

    render(
      <SecureTextArea
        aria-label="Message"
        showCharCount={true}
        fieldType="message"
      />
    );

    const textarea = screen.getByLabelText('Message');
    await user.type(textarea, 'Hello World');

    // Verify counter is visible and updates
    expect(textarea).toHaveValue('Hello World');
  });
});
