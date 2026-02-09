/**
 * Paste Guard
 * Client-side protection against malicious paste/drag-and-drop into text fields.
 * Blocks binary data, Base64 content, Data URIs, and oversized pastes.
 */

// Re-export types, constants, and detection from split modules
export type { PasteGuardConfig } from './paste-guard.types';
export { DEFAULT_PASTE_GUARD_CONFIG } from './paste-guard.types';
export { validatePastedText } from './paste-guard-detection';

import type { PasteGuardConfig } from './paste-guard.types';
import { DEFAULT_PASTE_GUARD_CONFIG } from './paste-guard.types';
import { validatePastedText } from './paste-guard-detection';

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
