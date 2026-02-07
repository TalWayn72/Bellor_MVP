/**
 * SecureTextInput
 * A secure text input component with built-in sanitization,
 * paste protection, and drag-and-drop blocking.
 */

import React, { forwardRef } from 'react';
import { useSecureInput, type UseSecureInputOptions } from '../../hooks/useSecureInput';
import { Input } from '../ui/input';

export interface SecureTextInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange' | 'value' | 'maxLength'> {
  /** Field type for automatic security config */
  fieldType?: string;
  /** Custom security options */
  securityOptions?: UseSecureInputOptions;
  /** External value (controlled mode) */
  value?: string;
  /** Change handler */
  onSecureChange?: (value: string) => void;
  /** Callback when input is blocked */
  onBlocked?: (reason: string) => void;
  /** Show character counter */
  showCharCount?: boolean;
}

export const SecureTextInput = forwardRef<HTMLInputElement, SecureTextInputProps>(
  function SecureTextInput(
    {
      fieldType = 'message',
      securityOptions,
      value: externalValue,
      onSecureChange,
      onBlocked,
      showCharCount = false,
      className,
      ...props
    },
    ref
  ) {
    const {
      value,
      onChange,
      onPaste,
      onDrop,
      onDragOver,
      maxLength,
      isBlocked,
      charCount,
      setValue,
    } = useSecureInput({
      fieldType,
      initialValue: externalValue || '',
      onBlocked,
      onChange: onSecureChange,
      ...securityOptions,
    });

    // Sync external value
    React.useEffect(() => {
      if (externalValue !== undefined && externalValue !== value) {
        setValue(externalValue);
      }
    }, [externalValue]);

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={onDragOver}
          maxLength={maxLength}
          className={`${className || ''} ${isBlocked ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          {...props}
        />
        {showCharCount && (
          <span className="absolute right-2 bottom-1 text-xs text-muted-foreground">
            {charCount}/{maxLength}
          </span>
        )}
        {isBlocked && (
          <p className="text-xs text-red-500 mt-1">
            Input blocked for security reasons
          </p>
        )}
      </div>
    );
  }
);
