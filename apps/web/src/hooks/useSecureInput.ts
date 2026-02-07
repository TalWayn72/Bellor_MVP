/**
 * useSecureInput Hook
 * React hook for secure text input with real-time sanitization,
 * paste protection, and drag-and-drop blocking.
 */

import { useState, useCallback, useRef } from 'react';
import { sanitizeText, getFieldConfig, type InputSecurityConfig } from '../security/input-sanitizer';
import {
  createPasteHandler,
  createDropHandler,
  createDragOverHandler,
  type PasteGuardConfig,
  DEFAULT_PASTE_GUARD_CONFIG,
} from '../security/paste-guard';

export interface UseSecureInputOptions {
  /** Field type for automatic config selection */
  fieldType?: string;
  /** Custom security config (overrides fieldType) */
  config?: InputSecurityConfig;
  /** Custom paste guard config */
  pasteConfig?: Partial<PasteGuardConfig>;
  /** Initial value */
  initialValue?: string;
  /** Callback when input is blocked */
  onBlocked?: (reason: string) => void;
  /** Callback when value changes */
  onChange?: (value: string) => void;
}

export interface SecureInputHandlers {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  maxLength: number;
}

export function useSecureInput(options: UseSecureInputOptions = {}): SecureInputHandlers & {
  setValue: (value: string) => void;
  isBlocked: boolean;
  charCount: number;
} {
  const {
    fieldType = 'message',
    config: customConfig,
    pasteConfig,
    initialValue = '',
    onBlocked,
    onChange: onChangeProp,
  } = options;

  const securityConfig = customConfig || getFieldConfig(fieldType);
  const pasteGuardConfig: PasteGuardConfig = {
    ...DEFAULT_PASTE_GUARD_CONFIG,
    ...pasteConfig,
  };

  const [value, setValueState] = useState(initialValue);
  const [isBlocked, setIsBlocked] = useState(false);
  const blockTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlock = useCallback((reason: string) => {
    setIsBlocked(true);
    onBlocked?.(reason);

    // Reset blocked state after 2 seconds
    if (blockTimeoutRef.current) {
      clearTimeout(blockTimeoutRef.current);
    }
    blockTimeoutRef.current = setTimeout(() => {
      setIsBlocked(false);
    }, 2000);
  }, [onBlocked]);

  const setValue = useCallback((newValue: string) => {
    const result = sanitizeText(newValue, securityConfig);
    if (result.blocked) {
      handleBlock('Dangerous content detected');
      return;
    }
    setValueState(result.text);
    onChangeProp?.(result.text);
  }, [securityConfig, handleBlock, onChangeProp]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
  }, [setValue]);

  const handlePaste = createPasteHandler(pasteGuardConfig, handleBlock);
  const handleDrop = createDropHandler(handleBlock);
  const handleDragOver = createDragOverHandler();

  return {
    value,
    setValue,
    onChange: handleChange,
    onPaste: handlePaste,
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    maxLength: securityConfig.maxLength,
    isBlocked,
    charCount: value.length,
  };
}
