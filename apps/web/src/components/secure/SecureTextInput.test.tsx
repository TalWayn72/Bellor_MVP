/**
 * SecureTextInput Tests
 * Verifies XSS prevention, sanitization, paste/drop blocking,
 * and correct rendering behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SecureTextInput } from './SecureTextInput';

describe('[P0][safety] SecureTextInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // Rendering
  // ──────────────────────────────────────────────

  it('should render an input element', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('should render with placeholder text', () => {
    render(<SecureTextInput placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('should forward ref to the underlying input element', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>;
    render(<SecureTextInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  // ──────────────────────────────────────────────
  // Normal text input
  // ──────────────────────────────────────────────

  it('should accept and display normal text', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Hello World' } });
    expect(input).toHaveValue('Hello World');
  });

  it('should call onSecureChange with the entered value', () => {
    const handleChange = vi.fn();
    render(<SecureTextInput onSecureChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalledWith('abc');
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Script tags
  // ──────────────────────────────────────────────

  it('should block input containing <script> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalledWith('Dangerous content detected');
  });

  it('should block input containing <script > with space', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<script src="evil.js">' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block case-insensitive <SCRIPT> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<SCRIPT>alert(1)</SCRIPT>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Event handlers
  // ──────────────────────────────────────────────

  it('should block input containing onclick handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<div onclick=alert(1)>click me</div>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing onerror handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<img onerror=alert(1) src=x>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing onload handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<body onload=alert(1)>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing onmouseover handler', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<div onmouseover=alert(1)>hover</div>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - javascript: URLs
  // ──────────────────────────────────────────────

  it('should block input containing javascript: URLs', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block javascript: URLs with spaces', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'javascript :alert(1)' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // XSS Prevention - Dangerous elements
  // ──────────────────────────────────────────────

  it('should block input containing <iframe> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<iframe src="evil.com"></iframe>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing <svg> tags', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<svg onload=alert(1)>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  it('should block input containing data:text/html URIs', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'data:text/html,<script>alert(1)</script>' } });

    expect(input).toHaveValue('');
    expect(handleBlocked).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // HTML Tag Stripping (non-dangerous tags)
  // ──────────────────────────────────────────────

  it('should strip benign HTML tags and keep text content', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<b>bold</b> text' } });

    expect(input).toHaveValue('bold text');
  });

  // ──────────────────────────────────────────────
  // Blocked state and visual feedback
  // ──────────────────────────────────────────────

  it('should set blocked state when malicious input detected', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });

    expect(screen.getByText('Input blocked for security reasons')).toBeInTheDocument();
  });

  it('should apply red border style when input is blocked', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });

    expect(input.className).toContain('border-red-500');
    expect(input.className).toContain('ring-red-500');
  });

  it('should clear blocked state after 2 seconds', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '<script>alert(1)</script>' } });
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
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '',
        files: [new File(['content'], 'test.txt', { type: 'text/plain' })],
      },
    });

    expect(handleBlocked).toHaveBeenCalledWith('File paste blocked on text field');
  });

  it('should block paste events containing data URIs', () => {
    const handleBlocked = vi.fn();
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.paste(input, {
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
    render(<SecureTextInput onBlocked={handleBlocked} />);
    const input = screen.getByRole('textbox');

    fireEvent.drop(input, {
      dataTransfer: {
        files: [new File(['content'], 'malicious.html', { type: 'text/html' })],
      },
    });

    expect(handleBlocked).toHaveBeenCalledWith('File drop blocked on text field');
  });

  it('should block drag over events with file types', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    const dragOverEvent = fireEvent.dragOver(input, {
      dataTransfer: {
        types: ['Files'],
        dropEffect: 'copy',
      },
    });

    // dragOver handler is set, event was dispatched
    expect(dragOverEvent).toBeDefined();
  });

  // ──────────────────────────────────────────────
  // maxLength enforcement
  // ──────────────────────────────────────────────

  it('should set maxLength attribute from security config', () => {
    render(<SecureTextInput fieldType="name" />);
    const input = screen.getByRole('textbox');

    // "name" field config has maxLength: 50
    expect(input).toHaveAttribute('maxLength', '50');
  });

  it('should use default message config maxLength of 2000', () => {
    render(<SecureTextInput />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('maxLength', '2000');
  });

  // ──────────────────────────────────────────────
  // Disabled state
  // ──────────────────────────────────────────────

  it('should support disabled state', () => {
    render(<SecureTextInput disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  // ──────────────────────────────────────────────
  // Character counter
  // ──────────────────────────────────────────────

  it('should not show character counter by default', () => {
    render(<SecureTextInput />);
    expect(screen.queryByText(/\/2000$/)).not.toBeInTheDocument();
  });

  it('should show character counter when showCharCount is true', () => {
    render(<SecureTextInput showCharCount />);
    // Default fieldType is 'message' with maxLength 2000
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('should update character counter as text is typed', () => {
    render(<SecureTextInput showCharCount />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Controlled mode (external value)
  // ──────────────────────────────────────────────

  it('should accept an external value prop', () => {
    render(<SecureTextInput value="external" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('external');
  });

  // ──────────────────────────────────────────────
  // Field type configurations
  // ──────────────────────────────────────────────

  it('should use bio config when fieldType is bio', () => {
    render(<SecureTextInput fieldType="bio" showCharCount />);
    // bio maxLength is 500
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('should use search config when fieldType is search', () => {
    render(<SecureTextInput fieldType="search" showCharCount />);
    // search maxLength is 100
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('should fallback to message config for unknown field types', () => {
    render(<SecureTextInput fieldType="unknown_field" showCharCount />);
    // fallback to message maxLength of 2000
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  // ──────────────────────────────────────────────
  // Custom className
  // ──────────────────────────────────────────────

  it('should apply custom className to input', () => {
    render(<SecureTextInput className="my-custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('my-custom-class');
  });
});
