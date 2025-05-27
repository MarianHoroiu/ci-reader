'use client';

import { useCallback, useState } from 'react';
import {
  validateFile,
  validateFiles,
  validateFileQuick,
  type FileValidationResult,
  type BatchValidationResult,
} from '@/lib/validation/file-type-validator';

export interface UseFileValidationOptions {
  /** Whether to use quick validation (MIME type and size only) */
  quickValidation?: boolean;
  /** Callback when validation completes */
  onValidationComplete?: (_result: FileValidationResult) => void;
  /** Callback when batch validation completes */
  onBatchValidationComplete?: (_result: BatchValidationResult) => void;
  /** Callback when validation fails */
  onValidationError?: (_error: string, _errorCode: string) => void;
}

export interface UseFileValidationReturn {
  /** Current validation state */
  isValidating: boolean;
  /** Last validation result */
  lastResult: FileValidationResult | null;
  /** Last batch validation result */
  lastBatchResult: BatchValidationResult | null;
  /** Validation error if any */
  validationError: string | null;

  /** Validate a single file */
  validateSingleFile: (_file: File) => Promise<FileValidationResult>;
  /** Validate multiple files */
  validateMultipleFiles: (_files: File[]) => Promise<BatchValidationResult>;
  /** Quick validation for a single file */
  quickValidateFile: (_file: File) => FileValidationResult;
  /** Clear validation state */
  clearValidation: () => void;
  /** Reset validation error */
  clearError: () => void;
}

export function useFileValidation(
  options: UseFileValidationOptions = {}
): UseFileValidationReturn {
  const {
    quickValidation = false,
    onValidationComplete,
    onBatchValidationComplete,
    onValidationError,
  } = options;

  // State
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<FileValidationResult | null>(
    null
  );
  const [lastBatchResult, setLastBatchResult] =
    useState<BatchValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear validation state
  const clearValidation = useCallback(() => {
    setLastResult(null);
    setLastBatchResult(null);
    setValidationError(null);
    setIsValidating(false);
  }, []);

  // Clear validation error
  const clearError = useCallback(() => {
    setValidationError(null);
  }, []);

  // Quick validation for a single file
  const quickValidateFile = useCallback(
    (file: File): FileValidationResult => {
      const result = validateFileQuick(file);

      if (!result.isValid && result.error && result.errorCode) {
        onValidationError?.(result.error, result.errorCode);
      }

      return result;
    },
    [onValidationError]
  );

  // Validate a single file
  const validateSingleFile = useCallback(
    async (file: File): Promise<FileValidationResult> => {
      setIsValidating(true);
      setValidationError(null);

      try {
        let result: FileValidationResult;

        if (quickValidation) {
          result = quickValidateFile(file);
        } else {
          result = await validateFile(file);
        }

        setLastResult(result);
        onValidationComplete?.(result);

        if (!result.isValid && result.error && result.errorCode) {
          onValidationError?.(result.error, result.errorCode);
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Validation failed';
        setValidationError(errorMessage);
        onValidationError?.(errorMessage, 'VALIDATION_ERROR');

        const failedResult: FileValidationResult = {
          isValid: false,
          error: errorMessage,
          errorCode: 'CORRUPTED_FILE',
        };

        setLastResult(failedResult);
        return failedResult;
      } finally {
        setIsValidating(false);
      }
    },
    [
      quickValidation,
      quickValidateFile,
      onValidationComplete,
      onValidationError,
    ]
  );

  // Validate multiple files
  const validateMultipleFiles = useCallback(
    async (files: File[]): Promise<BatchValidationResult> => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await validateFiles(files);
        setLastBatchResult(result);
        onBatchValidationComplete?.(result);

        // Report errors for invalid files
        if (result.invalidFiles.length > 0) {
          const firstError = result.invalidFiles[0];
          if (firstError) {
            onValidationError?.(firstError.error, firstError.errorCode);
          }
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Batch validation failed';
        setValidationError(errorMessage);
        onValidationError?.(errorMessage, 'VALIDATION_ERROR');

        const failedResult: BatchValidationResult = {
          validFiles: [],
          invalidFiles: files.map(file => ({
            file,
            error: errorMessage,
            errorCode: 'CORRUPTED_FILE',
          })),
          summary: {
            total: files.length,
            valid: 0,
            invalid: files.length,
          },
        };

        setLastBatchResult(failedResult);
        return failedResult;
      } finally {
        setIsValidating(false);
      }
    },
    [onBatchValidationComplete, onValidationError]
  );

  return {
    // State
    isValidating,
    lastResult,
    lastBatchResult,
    validationError,

    // Actions
    validateSingleFile,
    validateMultipleFiles,
    quickValidateFile,
    clearValidation,
    clearError,
  };
}
