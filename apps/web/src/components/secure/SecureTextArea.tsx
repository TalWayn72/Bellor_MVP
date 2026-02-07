/**
 * SecureTextArea
 * A secure textarea component with built-in sanitization,
 * paste protection, and drag-and-drop blocking.
 */

import React, { forwardRef } from 'react';
import { useSecureInput, type UseSecureInputOptions } from '../../hooks/useSecureInput';
import { Textarea } from '../ui/textarea';

export interface SecureTextAreaProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Textarea>, 'onChange' | 'value' | 'maxLength'> {
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

export const SecureTextArea = forwardRef<HTMLTextAreaElement, SecureTextAreaProps>(
  function SecureTextArea(
    {
      fieldType = 'bio',
      securityOptions,
      value: externalValue,
      onSecureChange,
      onBlocked,
      showCharCount = true,
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
        <Textarea
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
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              {charCount}/{maxLength}
            </span>
          </div>
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
