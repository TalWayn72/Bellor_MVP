/**
 * useSecureUpload Hook
 * React hook for secure file uploads with client-side validation.
 * Validates file type, size, and extension before upload.
 */

import { useState, useCallback } from 'react';
import { validateFile } from './upload-validation';

// Re-export types and configs so existing imports continue to work
export type { FileValidationConfig, UploadValidationResult } from './upload-validation';
export { IMAGE_UPLOAD_CONFIG, AUDIO_UPLOAD_CONFIG } from './upload-validation';

import type { FileValidationConfig } from './upload-validation';

export interface UseSecureUploadOptions {
  config: FileValidationConfig;
  onValidFile?: (file: File) => void;
  onError?: (error: string) => void;
}

export function useSecureUpload(options: UseSecureUploadOptions) {
  const { config, onValidFile, onError } = options;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndSelect = useCallback((files: FileList | null) => {
    setError(null);
    setSelectedFile(null);

    if (!files || files.length === 0) {
      return;
    }

    setIsValidating(true);

    // Check file count
    if (config.maxFiles && files.length > config.maxFiles) {
      const errorMsg = `Maximum ${config.maxFiles} file(s) allowed`;
      setError(errorMsg);
      onError?.(errorMsg);
      setIsValidating(false);
      return;
    }

    // Validate first file
    const result = validateFile(files[0], config);

    if (!result.valid) {
      setError(result.error || 'File validation failed');
      onError?.(result.error || 'File validation failed');
      setIsValidating(false);
      return;
    }

    setSelectedFile(result.file!);
    onValidFile?.(result.file!);
    setIsValidating(false);
  }, [config, onValidFile, onError]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSelect(e.target.files);
  }, [validateAndSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    validateAndSelect(e.dataTransfer.files);
  }, [validateAndSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setIsValidating(false);
  }, []);

  return {
    selectedFile,
    error,
    isValidating,
    handleFileChange,
    handleDrop,
    handleDragOver,
    validateAndSelect,
    reset,
    /** Accept string for file input element */
    accept: config.allowedTypes.join(','),
  };
}
