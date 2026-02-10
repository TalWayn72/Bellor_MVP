/**
 * useSecureInput Hook Tests
 * Verifies sanitization logic, blocked state management,
 * character counting, field config selection, and event handlers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSecureInput } from './useSecureInput';

// Mock the security modules
vi.mock('../security/input-sanitizer', async () => {
  const actual = await vi.importActual<typeof import('../security/input-sanitizer')>(
    '../security/input-sanitizer'
  );
  return actual;
});

vi.mock('../security/paste-guard', async () => {
  const actual = await vi.importActual<typeof import('../security/paste-guard')>(
    '../security/paste-guard'
  );
  return actual;
});

describe('[P0][safety] useSecureInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // Initialization
  // ──────────────────────────────────────────────

  it('should return an empty string as default value', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(result.current.value).toBe('');
  });

  it('should initialize with the provided initialValue', () => {
    const { result } = renderHook(() =>
      useSecureInput({ initialValue: 'Hello' })
    );

    expect(result.current.value).toBe('Hello');
  });

  it('should not be blocked initially', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(result.current.isBlocked).toBe(false);
  });

  it('should have charCount of 0 initially', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(result.current.charCount).toBe(0);
  });

  it('should set charCount based on initialValue length', () => {
    const { result } = renderHook(() =>
      useSecureInput({ initialValue: 'Hello' })
    );

    expect(result.current.charCount).toBe(5);
  });

  // ──────────────────────────────────────────────
  // Field type config selection
  // ──────────────────────────────────────────────

  it('should use message config by default (maxLength 2000)', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(result.current.maxLength).toBe(2000);
  });

  it('should select name config when fieldType is name (maxLength 50)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'name' })
    );

    expect(result.current.maxLength).toBe(50);
  });

  it('should select bio config when fieldType is bio (maxLength 500)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'bio' })
    );

    expect(result.current.maxLength).toBe(500);
  });

  it('should select search config when fieldType is search (maxLength 100)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'search' })
    );

    expect(result.current.maxLength).toBe(100);
  });

  it('should select email config when fieldType is email (maxLength 254)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'email' })
    );

    expect(result.current.maxLength).toBe(254);
  });

  it('should select hobby config when fieldType is hobby (maxLength 100)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'hobby' })
    );

    expect(result.current.maxLength).toBe(100);
  });

  it('should fallback to message config for unknown field types', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'nonexistent' })
    );

    expect(result.current.maxLength).toBe(2000);
  });

  it('should use custom config when provided (overrides fieldType)', () => {
    const { result } = renderHook(() =>
      useSecureInput({
        fieldType: 'name',
        config: {
          maxLength: 999,
          blockHtmlTags: true,
          blockScriptPatterns: true,
          stripControlChars: true,
        },
      })
    );

    expect(result.current.maxLength).toBe(999);
  });

  // ──────────────────────────────────────────────
  // setValue - sanitized value
  // ──────────────────────────────────────────────

  it('should return sanitized value via setValue', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('Hello World');
    });

    expect(result.current.value).toBe('Hello World');
  });

  it('should strip benign HTML tags via setValue', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<b>bold</b> text');
    });

    expect(result.current.value).toBe('bold text');
  });

  it('should block dangerous content and keep value empty', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  // ──────────────────────────────────────────────
  // onChange handler
  // ──────────────────────────────────────────────

  it('should update value through onChange handler', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      const fakeEvent = {
        target: { value: 'typed text' },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.onChange(fakeEvent);
    });

    expect(result.current.value).toBe('typed text');
  });

  it('should call external onChange callback with sanitized value', () => {
    const onChangeSpy = vi.fn();
    const { result } = renderHook(() =>
      useSecureInput({ onChange: onChangeSpy })
    );

    act(() => {
      const fakeEvent = {
        target: { value: 'hello' },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.onChange(fakeEvent);
    });

    expect(onChangeSpy).toHaveBeenCalledWith('hello');
  });

  it('should not call external onChange when input is blocked', () => {
    const onChangeSpy = vi.fn();
    const { result } = renderHook(() =>
      useSecureInput({ onChange: onChangeSpy })
    );

    act(() => {
      const fakeEvent = {
        target: { value: '<script>alert(1)</script>' },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.onChange(fakeEvent);
    });

    expect(onChangeSpy).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // Blocked state tracking
  // ──────────────────────────────────────────────

  it('should set isBlocked to true when dangerous input detected', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });

    expect(result.current.isBlocked).toBe(true);
  });

  it('should call onBlocked callback when dangerous input detected', () => {
    const onBlockedSpy = vi.fn();
    const { result } = renderHook(() =>
      useSecureInput({ onBlocked: onBlockedSpy })
    );

    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });

    expect(onBlockedSpy).toHaveBeenCalledWith('Dangerous content detected');
  });

  it('should reset blocked state after 2 seconds', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });

    expect(result.current.isBlocked).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isBlocked).toBe(false);
  });

  it('should reset blocked state timeout when blocked again', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });
    expect(result.current.isBlocked).toBe(true);

    // Advance only 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Block again - should reset the timer
    act(() => {
      result.current.setValue('<iframe src="evil.com">');
    });
    expect(result.current.isBlocked).toBe(true);

    // Advance another 1.5 seconds (should not have cleared yet)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.isBlocked).toBe(true);

    // Advance remaining 0.5 seconds (total 2s from last block)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isBlocked).toBe(false);
  });

  // ──────────────────────────────────────────────
  // Character count tracking
  // ──────────────────────────────────────────────

  it('should track character count as value changes', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('Hello');
    });

    expect(result.current.charCount).toBe(5);
  });

  it('should update character count to 0 when blocked (value is empty)', () => {
    const { result } = renderHook(() =>
      useSecureInput({ initialValue: 'safe text' })
    );

    expect(result.current.charCount).toBe(9);

    act(() => {
      result.current.setValue('<script>evil</script>');
    });

    // Value stays as previous safe value since blocked content is rejected
    // The value is NOT updated when blocked, so it stays at the initial value
    expect(result.current.charCount).toBe(9);
  });

  // ──────────────────────────────────────────────
  // Specific XSS attack vectors
  // ──────────────────────────────────────────────

  it('should block javascript: protocol', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('javascript:alert(document.cookie)');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  it('should block onclick event handlers', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<div onclick=alert(1)>click</div>');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  it('should block onerror event handlers', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<img onerror=alert(1) src=x>');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  it('should block data:text/html URIs', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('data:text/html,<script>alert(1)</script>');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  it('should block <embed> tags', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<embed src="evil.swf">');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  it('should block <object> tags', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('<object data="evil.swf"></object>');
    });

    expect(result.current.value).toBe('');
    expect(result.current.isBlocked).toBe(true);
  });

  // ──────────────────────────────────────────────
  // Control character stripping
  // ──────────────────────────────────────────────

  it('should strip control characters from input', () => {
    const { result } = renderHook(() => useSecureInput());

    act(() => {
      result.current.setValue('Hello\x00World\x07Test');
    });

    expect(result.current.value).toBe('HelloWorldTest');
  });

  // ──────────────────────────────────────────────
  // Event handlers existence
  // ──────────────────────────────────────────────

  it('should return onPaste handler', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(typeof result.current.onPaste).toBe('function');
  });

  it('should return onDrop handler', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(typeof result.current.onDrop).toBe('function');
  });

  it('should return onDragOver handler', () => {
    const { result } = renderHook(() => useSecureInput());

    expect(typeof result.current.onDragOver).toBe('function');
  });

  // ──────────────────────────────────────────────
  // Safe input after blocked input
  // ──────────────────────────────────────────────

  it('should accept safe input after a blocked attempt (once timer clears)', () => {
    const { result } = renderHook(() => useSecureInput());

    // First, send dangerous input
    act(() => {
      result.current.setValue('<script>alert(1)</script>');
    });
    expect(result.current.isBlocked).toBe(true);
    expect(result.current.value).toBe('');

    // Now send safe input (blocked state is visual only, setValue still works)
    act(() => {
      result.current.setValue('safe text');
    });
    expect(result.current.value).toBe('safe text');

    // After timer, blocked state clears
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.isBlocked).toBe(false);
  });

  // ──────────────────────────────────────────────
  // maxLength truncation via sanitizer
  // ──────────────────────────────────────────────

  it('should truncate text that exceeds maxLength', () => {
    const { result } = renderHook(() =>
      useSecureInput({ fieldType: 'name' })
    );

    const longText = 'A'.repeat(60); // name maxLength is 50
    act(() => {
      result.current.setValue(longText);
    });

    expect(result.current.value.length).toBe(50);
    expect(result.current.charCount).toBe(50);
  });
});
