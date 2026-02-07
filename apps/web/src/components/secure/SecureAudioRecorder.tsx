/**
 * SecureAudioRecorder
 * A secure audio upload/record component with client-side validation.
 * Validates audio file type, size, and duration before upload.
 */

import React, { useRef } from 'react';
import { useSecureUpload, AUDIO_UPLOAD_CONFIG, type FileValidationConfig } from '../../hooks/useSecureUpload';
import { Button } from '../ui/button';

export interface SecureAudioRecorderProps {
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
}

export function SecureAudioRecorder({
  config = AUDIO_UPLOAD_CONFIG,
  onFileSelected,
  onError,
  label = 'Upload Audio',
  className = '',
  disabled = false,
}: SecureAudioRecorderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

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
      setAudioUrl(URL.createObjectURL(file));
    },
    onError,
  });

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    reset();
    setAudioUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors duration-200
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-950' : 'border-gray-300 hover:border-primary dark:border-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {audioUrl ? (
          <div className="space-y-2">
            <audio controls src={audioUrl} className="w-full" />
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {isValidating ? 'Validating...' : label}
            </p>
            <p className="text-xs text-muted-foreground">
              Allowed: {config.allowedExtensions.join(', ')} (max {Math.round(config.maxSize / 1024 / 1024)}MB, max 60s)
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
