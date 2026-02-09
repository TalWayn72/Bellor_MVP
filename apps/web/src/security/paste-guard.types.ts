/**
 * Paste Guard Types & Constants
 * Type definitions and default configuration for paste protection.
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
