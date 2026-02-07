/**
 * SecureImageUpload
 * A secure image upload component with client-side validation.
 * Validates file type, size, and extension before upload.
 */

import React, { useRef } from 'react';
import { useSecureUpload, IMAGE_UPLOAD_CONFIG, type FileValidationConfig } from '../../hooks/useSecureUpload';
import { Button } from '../ui/button';

export interface SecureImageUploadProps {
  /** Custom validation config */
  config?: FileValidationConfig;
  /** Callback when a valid file is selected */
  onFileSelected?: (file: File) => void;
  /** Callback on validation error */
  onError?: (error: string) => void;
  /** Upload button label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Show preview */
  showPreview?: boolean;
}

export function SecureImageUpload({
  config = IMAGE_UPLOAD_CONFIG,
  onFileSelected,
  onError,
  label = 'Upload Image',
  className = '',
  disabled = false,
  showPreview = true,
}: SecureImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const {
    selectedFile,
    error,
    isValidating,
    handleFileChange,
    handleDrop,
    handleDragOver,
    accept,
    reset,
  } = useSecureUpload({
    config,
    onValidFile: (file) => {
      onFileSelected?.(file);
      if (showPreview) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    onError,
  });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    reset();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-950' : 'border-gray-300 hover:border-primary dark:border-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {preview && showPreview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute top-1 right-1"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {isValidating ? 'Validating...' : label}
            </p>
            <p className="text-xs text-muted-foreground">
              Allowed: {config.allowedExtensions.join(', ')} (max {Math.round(config.maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* File info */}
      {selectedFile && !error && (
        <p className="text-xs text-muted-foreground">
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}
    </div>
  );
}
