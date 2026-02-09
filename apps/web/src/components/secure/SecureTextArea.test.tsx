/**
 * SecureTextArea Tests
 * Verifies XSS prevention, sanitization, paste/drop blocking,
 * multiline support, and correct rendering behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SecureTextArea } from './SecureTextArea';

describe('SecureTextArea', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // Rendering
  // ──────────────────────────────────────────────

  it('should render a textarea element', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should render with placeholder text', () => {
    render(<SecureTextArea placeholder="Write your bio..." />);
    expect(screen.getByPlaceholderText('Write your bio...')).toBeInTheDocument();
  });

  it('should forward ref to the underlying textarea element', () => {
    const ref = { current: null } as React.RefObject<HTMLTextAreaElement>;
    render(<SecureTextArea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  // ──────────────────────────────────────────────
  // Normal text input
  // ──────────────────────────────────────────────

  it('should accept and display normal text', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Hello World' } });
    expect(textarea).toHaveValue('Hello World');
  });

  it('should handle multiline input', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });
    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  it('should call onSecureChange with the entered value', () => {
    const handleChange = vi.fn();
    render(<SecureTextArea onSecureChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalledWith('abc');
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Script tags
  // ──────────────────────────────────────────────

  it('should block input containing <script> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<script>alert("xss")</script>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalledWith('Dangerous content detected');
  });

  it('should block case-insensitive script tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<SCRIPT>alert(1)</SCRIPT>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block multiline script injection attempts', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, {
      target: { value: 'Some text\n<script>alert(1)</script>\nMore text' },
    });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Event handlers
  // ──────────────────────────────────────────────

  it('should block input containing onclick handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<div onclick=alert(1)>click me</div>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing onerror handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<img onerror=alert(1) src=x>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - javascript: URLs
  // ──────────────────────────────────────────────

  it('should block input containing javascript: URLs', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'javascript:alert(1)' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Dangerous elements
  // ──────────────────────────────────────────────

  it('should block input containing <iframe> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<iframe src="evil.com"></iframe>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing <svg> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<svg onload=alert(1)>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing <embed> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<embed src="evil.swf">' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing <object> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<object data="evil.swf"></object>' } });

    expect(textarea).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // HTML Tag Stripping (non-dangerous tags)
  // ──────────────────────────────────────────────

  it('should strip benign HTML tags and keep text content', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<b>bold</b> <i>italic</i> text' } });

    expect(textarea).toHaveValue('bold italic text');
  });

  // ──────────────────────────────────────────────
  // Blocked state and visual feedback
  // ──────────────────────────────────────────────

  it('should show warning when input is blocked', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<script>alert(1)</script>' } });

    expect(screen.getByText('Input blocked for security reasons')).toBeInTheDocument();
  });

  it('should apply red border style when input is blocked', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<script>alert(1)</script>' } });

    expect(textarea.className).toContain('border-red-500');
    expect(textarea.className).toContain('ring-red-500');
  });

  it('should clear blocked state after 2 seconds', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '<script>alert(1)</script>' } });
    expect(screen.getByText('Input blocked for security reasons')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Input blocked for security reasons')).not.toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Paste events
  // ──────────────────────────────────────────────

  it('should block paste events containing files', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => '',
        files: [new File(['content'], 'test.txt', { type: 'text/plain' })],
      },
    });

    expect(handleBlocked).toHaveBeenCalledWith('File paste blocked on text field');
  });

  it('should block paste events containing data URIs', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => 'data:image/png;base64,iVBORw0KGgoAAAANS',
        files: [],
      },
    });

    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // Drop events
  // ──────────────────────────────────────────────

  it('should block drop events containing files', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextArea onBlocked={handleBlocked} />);
    const textarea = screen.getByRole('textbox');

    fireEvent.drop(textarea, {
      dataTransfer: {
        files: [new File(['content'], 'malicious.html', { type: 'text/html' })],
      },
    });

    expect(handleBlocked).toHaveBeenCalledWith('File drop blocked on text field');
  });

  // ──────────────────────────────────────────────
  // maxLength enforcement
  // ──────────────────────────────────────────────

  it('should set maxLength from default bio config (500)', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    // Default fieldType for SecureTextArea is 'bio' with maxLength 500
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('should use message config when fieldType is message', () => {
    render(<SecureTextArea fieldType="message" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('maxLength', '2000');
  });

  // ──────────────────────────────────────────────
  // Disabled state
  // ──────────────────────────────────────────────

  it('should support disabled state', () => {
    render(<SecureTextArea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  // ──────────────────────────────────────────────
  // Character counter
  // ──────────────────────────────────────────────

  it('should show character counter by default (showCharCount defaults to true)', () => {
    render(<SecureTextArea />);
    // Default fieldType is 'bio' with maxLength 500
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('should hide character counter when showCharCount is false', () => {
    render(<SecureTextArea showCharCount={false} />);
    expect(screen.queryByText('0/500')).not.toBeInTheDocument();
  });

  it('should update character counter as text is typed', () => {
    render(<SecureTextArea />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('should apply orange color when near maxLength (>90%)', () => {
    render(<SecureTextArea fieldType="name" />);
    const textarea = screen.getByRole('textbox');

    // name maxLength is 50, so 90% is 45 chars
    const longText = 'A'.repeat(46);
    fireEvent.change(textarea, { target: { value: longText } });

    const counter = screen.getByText('46/50');
    expect(counter.className).toContain('text-orange-500');
  });

  // ──────────────────────────────────────────────
  // Controlled mode (external value)
  // ──────────────────────────────────────────────

  it('should accept an external value prop', () => {
    render(<SecureTextArea value="external bio" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('external bio');
  });

  // ──────────────────────────────────────────────
  // Custom className
  // ──────────────────────────────────────────────

  it('should apply custom className to textarea', () => {
    render(<SecureTextArea className="my-custom-class" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('my-custom-class');
  });
});
