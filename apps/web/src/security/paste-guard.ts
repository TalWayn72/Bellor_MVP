/**
 * Paste Guard
 * Client-side protection against malicious paste/drag-and-drop into text fields.
 * Blocks binary data, Base64 content, Data URIs, and oversized pastes.
 */

export interface PasteGuardConfig {
  maxPasteLength: number;
  blockBinaryPaste: boolean;
  blockDataURIs: boolean;
  blockBase64Content: boolean;
  stripControlChars: boolean;
  blockFileDropOnTextFields: boolean;
}

export const DEFAULT_PASTE_GUARD_CONFIG: PasteGuardConfig = {
  maxPasteLength: 5000,
  blockBinaryPaste: true,
  blockDataURIs: true,
  blockBase64Content: true,
  stripControlChars: true,
  blockFileDropOnTextFields: true,
};

/**
 * Check if a string contains binary data patterns
 */
function containsBinaryData(text: string): boolean {
  // Check for null bytes and non-printable characters
  // eslint-disable-next-line no-control-regex
  const binaryPattern = /[\x00-\x08\x0E-\x1F\x7F-\x9F]/;
  return binaryPattern.test(text);
}

/**
 * Check if a string contains Base64 encoded content (long blocks)
 */
function containsBase64Content(text: string): boolean {
  // Match long Base64 strings (at least 40 chars of Base64 with padding)
  const base64Pattern = /(?:[A-Za-z0-9+/]{4}){10,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/;
  return base64Pattern.test(text);
}

/**
 * Check if a string contains Data URIs
 */
function containsDataURI(text: string): boolean {
  return /data\s*:\s*\w+\/\w+/i.test(text);
}

/**
 * Strip control characters from text
 */
function stripControlCharacters(text: string): string {
  // Remove control chars but keep newlines, tabs, and spaces
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and clean pasted text
 * Returns cleaned text or null if blocked
 */
export function validatePastedText(
  text: string,
  config: PasteGuardConfig = DEFAULT_PASTE_GUARD_CONFIG
): { text: string; blocked: boolean; reason?: string } {
  // Check paste length
  if (text.length > config.maxPasteLength) {
    return {
      text: text.substring(0, config.maxPasteLength),
      blocked: false,
      reason: 'Paste truncated to maximum length',
    };
  }

  // Check for binary data
  if (config.blockBinaryPaste && containsBinaryData(text)) {
    return { text: '', blocked: true, reason: 'Binary data detected in paste' };
  }

  // Check for Data URIs
  if (config.blockDataURIs && containsDataURI(text)) {
    return { text: '', blocked: true, reason: 'Data URI detected in paste' };
  }

  // Check for Base64 content
  if (config.blockBase64Content && containsBase64Content(text)) {
    return { text: '', blocked: true, reason: 'Encoded content detected in paste' };
  }

  // Strip control characters
  let cleaned = text;
  if (config.stripControlChars) {
    cleaned = stripControlCharacters(cleaned);
  }

  return { text: cleaned, blocked: false };
}

/**
 * Create a paste event handler for React elements
 */
export function createPasteHandler(
  config: PasteGuardConfig = DEFAULT_PASTE_GUARD_CONFIG,
  onBlock?: (reason: string) => void
) {
  return (event: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text/plain');

    // Check if paste contains files
    if (event.clipboardData.files.length > 0) {
      event.preventDefault();
      onBlock?.('File paste blocked on text field');
      return;
    }

    const result = validatePastedText(pastedText, config);

    if (result.blocked) {
      event.preventDefault();
      onBlock?.(result.reason || 'Paste blocked');
      return;
    }

    // If text was cleaned/modified, replace the paste
    if (result.text !== pastedText) {
      event.preventDefault();
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const currentValue = target.value;
      const newValue = currentValue.substring(0, start) + result.text + currentValue.substring(end);

      // Trigger React-compatible value change
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;

      nativeInputValueSetter?.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
}

/**
 * Create a drop event handler to block file drops on text fields
 */
export function createDropHandler(onBlock?: (reason: string) => void) {
  return (event: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.dataTransfer.files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      onBlock?.('File drop blocked on text field');
    }
  };
}

/**
 * Create a dragover handler (needed to properly block drops)
 */
export function createDragOverHandler() {
  return (event: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'none';
    }
  };
}
