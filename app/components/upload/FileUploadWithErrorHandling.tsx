'use client';

import React, { useState, useCallback } from 'react';
import {
  validateFile,
  type FileValidationResult,
} from '@/lib/validation/file-type-validator';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import ErrorDisplay from './ErrorDisplay';
import ErrorToast from './ErrorToast';
import FileUploadZone from './FileUploadZone';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';
import { type ErrorContext } from '@/lib/constants/error-messages';

export interface FileUploadWithErrorHandlingProps {
  /** Callback when files are successfully uploaded */
  onFilesUploaded?: (_files: File[]) => void;
  /** Callback when validation fails */
  onValidationError?: (
    _error: ValidationErrorCode,
    _context?: ErrorContext
  ) => void;
  /** Whether to show toast notifications */
  showToasts?: boolean;
  /** Whether to show detailed error displays */
  showDetailedErrors?: boolean;
  /** Maximum number of files to accept */
  maxFiles?: number;
  /** Additional CSS classes */
  className?: string;
}

const FileUploadWithErrorHandling: React.FC<
  FileUploadWithErrorHandlingProps
> = ({
  onFilesUploaded,
  onValidationError,
  showToasts = true,
  showDetailedErrors = true,
  maxFiles = 10,
  className = '',
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [validationResults, setValidationResults] = useState<
    Map<string, FileValidationResult>
  >(new Map());

  const { currentError, hasError, showError, dismissError, errorLog } =
    useErrorHandling({
      enableConsoleLogging: true,
      onError: error => {
        if (error.errorCode) {
          onValidationError?.(error.errorCode, error.context);
        }
      },
    });

  // Handle file selection
  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Check file count limit
      if (files.length > maxFiles) {
        showError('FILE_TOO_LARGE', {
          metadata: {
            reason: 'Too many files',
            maxFiles,
            selectedFiles: files.length,
          },
        });
        return;
      }

      const newValidationResults = new Map(validationResults);
      const validFiles: File[] = [];

      try {
        // Validate each file
        for (const file of files) {
          const result = await validateFile(file);
          const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

          newValidationResults.set(fileKey, result);

          if (result.isValid) {
            validFiles.push(file);
          } else if (result.errorCode) {
            // Show error for invalid file
            showError(result.errorCode, {
              fileName: file.name,
              fileSize: file.size,
              reportedMimeType: file.type,
              detectedMimeType: result.details?.detectedMimeType || undefined,
            });
            break; // Stop on first error for better UX
          }
        }

        setValidationResults(newValidationResults);

        // Update uploaded files with valid ones
        if (validFiles.length > 0) {
          const newUploadedFiles = [...uploadedFiles, ...validFiles];
          setUploadedFiles(newUploadedFiles);
          onFilesUploaded?.(newUploadedFiles);
        }
      } catch (error) {
        console.error('File validation error:', error);
        showError('CORRUPTED_FILE', {
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } finally {
        // Validation complete
      }
    },
    [maxFiles, validationResults, uploadedFiles, onFilesUploaded, showError]
  );

  // Handle file removal - removed since we don't show the uploaded files list anymore
  // File removal is now handled by the parent component

  // Handle recovery action
  const handleRecoveryAction = useCallback(
    (action: string) => {
      console.log('Recovery action triggered:', action);

      // Dismiss current error when user takes action
      dismissError();

      // You could implement specific recovery actions here
      // For example, opening file compression tools, format converters, etc.
    },
    [dismissError]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toast notifications */}
      {showToasts && hasError && currentError?.errorCode && (
        <ErrorToast
          isVisible={hasError}
          errorCode={currentError.errorCode}
          context={currentError.context}
          onDismiss={dismissError}
          autoHideDuration={5000}
        />
      )}

      {/* File upload zone */}
      <FileUploadZone onFilesSelected={handleFileSelect} className="min-h-32" />

      {/* Detailed error display */}
      {showDetailedErrors && hasError && currentError?.errorCode && (
        <ErrorDisplay
          errorCode={currentError.errorCode}
          context={currentError.context}
          onDismiss={dismissError}
          onRecoveryAction={handleRecoveryAction}
          showDetails={true}
          showSuggestions={true}
        />
      )}

      {/* Error log summary (for debugging) */}
      {process.env.NODE_ENV === 'development' && errorLog.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Error Log ({errorLog.length} entries)
          </summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {errorLog.slice(0, 5).map((error, _index) => (
              <div key={error.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="font-mono">{error.errorCode}</div>
                <div className="text-gray-400">
                  {new Date(error.timestamp).toLocaleTimeString()}
                  {error.displayDuration && ` • ${error.displayDuration}ms`}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default FileUploadWithErrorHandling;
