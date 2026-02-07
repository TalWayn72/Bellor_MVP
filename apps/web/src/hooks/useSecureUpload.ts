/**
 * useSecureUpload Hook
 * React hook for secure file uploads with client-side validation.
 * Validates file type, size, and extension before upload.
 */

import { useState, useCallback } from 'react';

export interface FileValidationConfig {
  allowedTypes: string[];
  allowedExtensions: string[];
  maxSize: number;
  maxFiles?: number;
}

export const IMAGE_UPLOAD_CONFIG: FileValidationConfig = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 6,
};

export const AUDIO_UPLOAD_CONFIG: FileValidationConfig = {
  allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/x-m4a'],
  allowedExtensions: ['.mp3', '.wav', '.ogg', '.m4a', '.webm'],
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 1,
};

const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.dll', '.scr', '.pif',
  '.vbs', '.js', '.ps1', '.sh', '.php', '.py', '.rb', '.pl',
  '.svg', '.html', '.htm', '.xml', '.swf', '.jar', '.class',
];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate a single file
 */
function validateFile(file: File, config: FileValidationConfig): UploadValidationResult {
  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  if (file.size > config.maxSize) {
    const maxMB = Math.round(config.maxSize / 1024 / 1024);
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type "${ext}" is not allowed` };
  }
  if (!config.allowedExtensions.includes(ext)) {
    return { valid: false, error: `File type "${ext}" is not supported. Allowed: ${config.allowedExtensions.join(', ')}` };
  }

  // Check double extension
  const parts = file.name.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length - 1; i++) {
      if (BLOCKED_EXTENSIONS.includes('.' + parts[i].toLowerCase())) {
        return { valid: false, error: 'Suspicious file name detected' };
      }
    }
  }

  // Check MIME type
  if (file.type && !config.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed` };
  }

  return { valid: true, file };
}

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
