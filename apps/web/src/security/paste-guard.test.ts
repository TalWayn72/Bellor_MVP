/**
 * Tests for Paste Guard
 * Validates protection against malicious paste/drag-and-drop content on text fields.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  validatePastedText,
  createPasteHandler,
  createDropHandler,
  createDragOverHandler,
  DEFAULT_PASTE_GUARD_CONFIG,
  type PasteGuardConfig,
} from './paste-guard';

describe('paste-guard', () => {
  describe('validatePastedText', () => {
    describe('plain text handling', () => {
      it('should allow normal plain text', () => {
        const result = validatePastedText('Hello, world!');
        expect(result.text).toBe('Hello, world!');
        expect(result.blocked).toBe(false);
      });

      it('should allow text with newlines and tabs', () => {
        const result = validatePastedText('Line 1\nLine 2\tTabbed');
        expect(result.text).toBe('Line 1\nLine 2\tTabbed');
        expect(result.blocked).toBe(false);
      });

      it('should allow empty string', () => {
        const result = validatePastedText('');
        expect(result.text).toBe('');
        expect(result.blocked).toBe(false);
      });

      it('should allow Unicode text', () => {
        const result = validatePastedText('שלום עולם');
        expect(result.text).toBe('שלום עולם');
        expect(result.blocked).toBe(false);
      });
    });

    describe('length enforcement', () => {
      it('should truncate text exceeding maxPasteLength', () => {
        const longText = 'a'.repeat(6000);
        const result = validatePastedText(longText);
        expect(result.text.length).toBe(DEFAULT_PASTE_GUARD_CONFIG.maxPasteLength);
        expect(result.blocked).toBe(false);
        expect(result.reason).toContain('truncated');
      });

      it('should not truncate text within maxPasteLength', () => {
        // Use text that won't trigger Base64 detection (mix of chars that break Base64 pattern)
        const text = 'Hello world! This is a normal paste. ';
        const result = validatePastedText(text);
        expect(result.text).toBe(text);
        expect(result.blocked).toBe(false);
        expect(result.reason).toBeUndefined();
      });

      it('should respect custom maxPasteLength', () => {
        const config: PasteGuardConfig = { ...DEFAULT_PASTE_GUARD_CONFIG, maxPasteLength: 10 };
        const result = validatePastedText('This is a longer text', config);
        expect(result.text.length).toBe(10);
        expect(result.text).toBe('This is a ');
      });
    });

    describe('binary data detection', () => {
      it('should block text with null bytes', () => {
        const result = validatePastedText('hello\x00world');
        expect(result.blocked).toBe(true);
        expect(result.text).toBe('');
        expect(result.reason).toContain('Binary data');
      });

      it('should block text with non-printable control characters', () => {
        const result = validatePastedText('text\x01\x02data');
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain('Binary data');
      });

      it('should not block when blockBinaryPaste is disabled', () => {
        const config: PasteGuardConfig = { ...DEFAULT_PASTE_GUARD_CONFIG, blockBinaryPaste: false };
        const result = validatePastedText('hello\x00world', config);
        expect(result.blocked).toBe(false);
      });
    });

    describe('Data URI detection', () => {
      it('should block text containing data:text/html URI', () => {
        const result = validatePastedText('data:text/html,<h1>evil</h1>');
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain('Data URI');
      });

      it('should block text containing data:image/png URI', () => {
        const result = validatePastedText('data:image/png,base64content');
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain('Data URI');
      });

      it('should block data URI with spaces', () => {
        const result = validatePastedText('data : text/html,content');
        expect(result.blocked).toBe(true);
      });

      it('should not block when blockDataURIs is disabled', () => {
        const config: PasteGuardConfig = { ...DEFAULT_PASTE_GUARD_CONFIG, blockDataURIs: false };
        const result = validatePastedText('data:text/html,<h1>test</h1>', config);
        // May still be blocked by binary detection, so disable that too
        config.blockBinaryPaste = false;
        config.blockBase64Content = false;
        const result2 = validatePastedText('data:text/html,content', config);
        expect(result2.blocked).toBe(false);
      });
    });

    describe('Base64 content detection', () => {
      it('should block long Base64 encoded content', () => {
        // 40+ chars of valid Base64
        const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop==';
        const result = validatePastedText(base64);
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain('Encoded content');
      });

      it('should not block short text that resembles Base64', () => {
        const result = validatePastedText('SGVsbG8=');
        expect(result.blocked).toBe(false);
      });

      it('should not block when blockBase64Content is disabled', () => {
        const config: PasteGuardConfig = {
          ...DEFAULT_PASTE_GUARD_CONFIG,
          blockBase64Content: false,
          blockBinaryPaste: false,
        };
        const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop==';
        const result = validatePastedText(base64, config);
        expect(result.blocked).toBe(false);
      });
    });

    describe('control character stripping', () => {
      it('should strip control characters when enabled but text is not binary-blocked', () => {
        // Use characters that containsBinaryData doesn't catch (0x0B, 0x0C)
        // Actually 0x0B is caught by binaryPattern, let's use config to disable binary blocking
        const config: PasteGuardConfig = {
          ...DEFAULT_PASTE_GUARD_CONFIG,
          blockBinaryPaste: false,
          stripControlChars: true,
        };
        const result = validatePastedText('hello\x00world', config);
        expect(result.text).toBe('helloworld');
        expect(result.blocked).toBe(false);
      });

      it('should not strip when stripControlChars is disabled', () => {
        const config: PasteGuardConfig = {
          ...DEFAULT_PASTE_GUARD_CONFIG,
          blockBinaryPaste: false,
          stripControlChars: false,
        };
        const result = validatePastedText('hello\x07world', config);
        // Text should pass through (binary detection is off, strip is off)
        expect(result.text).toBe('hello\x07world');
      });
    });
  });

  describe('DEFAULT_PASTE_GUARD_CONFIG', () => {
    it('should have maxPasteLength of 5000', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.maxPasteLength).toBe(5000);
    });

    it('should block binary paste by default', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.blockBinaryPaste).toBe(true);
    });

    it('should block Data URIs by default', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.blockDataURIs).toBe(true);
    });

    it('should block Base64 content by default', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.blockBase64Content).toBe(true);
    });

    it('should strip control chars by default', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.stripControlChars).toBe(true);
    });

    it('should block file drops by default', () => {
      expect(DEFAULT_PASTE_GUARD_CONFIG.blockFileDropOnTextFields).toBe(true);
    });
  });

  describe('createPasteHandler', () => {
    function createMockClipboardEvent(
      text: string,
      fileCount = 0
    ): React.ClipboardEvent<HTMLInputElement> {
      const files = Array.from({ length: fileCount }, () => new File([''], 'test.txt'));
      return {
        clipboardData: {
          getData: vi.fn().mockReturnValue(text),
          files: { length: fileCount, ...files },
        },
        preventDefault: vi.fn(),
        target: {
          value: '',
          selectionStart: 0,
          selectionEnd: 0,
          dispatchEvent: vi.fn(),
        },
      } as unknown as React.ClipboardEvent<HTMLInputElement>;
    }

    it('should not prevent default for safe plain text', () => {
      const handler = createPasteHandler();
      const event = createMockClipboardEvent('Hello world');

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default and call onBlock for blocked content', () => {
      const onBlock = vi.fn();
      const handler = createPasteHandler(DEFAULT_PASTE_GUARD_CONFIG, onBlock);
      const event = createMockClipboardEvent('data:text/html,evil');

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onBlock).toHaveBeenCalled();
    });

    it('should block file paste on text field', () => {
      const onBlock = vi.fn();
      const handler = createPasteHandler(DEFAULT_PASTE_GUARD_CONFIG, onBlock);
      const event = createMockClipboardEvent('', 1);

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onBlock).toHaveBeenCalledWith('File paste blocked on text field');
    });

    it('should work without onBlock callback', () => {
      const handler = createPasteHandler();
      const event = createMockClipboardEvent('data:text/html,evil');

      // Should not throw
      expect(() => handler(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default when text was modified (truncated)', () => {
      const config: PasteGuardConfig = { ...DEFAULT_PASTE_GUARD_CONFIG, maxPasteLength: 5 };
      const handler = createPasteHandler(config);

      // Create event with a real HTMLInputElement to avoid jsdom setter error
      const input = document.createElement('input');
      input.value = '';
      const event = {
        clipboardData: {
          getData: vi.fn().mockReturnValue('Hello World'),
          files: { length: 0 },
        },
        preventDefault: vi.fn(),
        target: input,
      } as unknown as React.ClipboardEvent<HTMLInputElement>;

      handler(event);

      // Text was truncated so it should replace the paste
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('createDropHandler', () => {
    function createMockDragEvent(fileCount: number): React.DragEvent<HTMLInputElement> {
      const files = Array.from({ length: fileCount }, () => new File([''], 'test.txt'));
      return {
        dataTransfer: {
          files: { length: fileCount, ...files },
        },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent<HTMLInputElement>;
    }

    it('should block drop when files are present', () => {
      const onBlock = vi.fn();
      const handler = createDropHandler(onBlock);
      const event = createMockDragEvent(1);

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(onBlock).toHaveBeenCalledWith('File drop blocked on text field');
    });

    it('should not block drop when no files are present', () => {
      const onBlock = vi.fn();
      const handler = createDropHandler(onBlock);
      const event = createMockDragEvent(0);

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onBlock).not.toHaveBeenCalled();
    });

    it('should work without onBlock callback', () => {
      const handler = createDropHandler();
      const event = createMockDragEvent(2);

      expect(() => handler(event)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('createDragOverHandler', () => {
    it('should prevent default and set dropEffect to none for file drags', () => {
      const handler = createDragOverHandler();
      const event = {
        dataTransfer: {
          types: ['Files'],
          dropEffect: 'copy',
        },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent<HTMLInputElement>;

      handler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('none');
    });

    it('should not prevent default for non-file drags', () => {
      const handler = createDragOverHandler();
      const event = {
        dataTransfer: {
          types: ['text/plain'],
          dropEffect: 'copy',
        },
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent<HTMLInputElement>;

      handler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });
});
