'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
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

  // Handle file removal
  const handleFileRemove = useCallback(
    (fileToRemove: File) => {
      const newFiles = uploadedFiles.filter(file => file !== fileToRemove);
      setUploadedFiles(newFiles);

      // Remove from validation results
      const fileKey = `${fileToRemove.name}_${fileToRemove.size}_${fileToRemove.lastModified}`;
      const newValidationResults = new Map(validationResults);
      newValidationResults.delete(fileKey);
      setValidationResults(newValidationResults);

      onFilesUploaded?.(newFiles);
    },
    [uploadedFiles, validationResults, onFilesUploaded]
  );

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

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, _index) => {
              const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

              return (
                <motion.div
                  key={fileKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <div>
                      <div className="text-sm font-medium text-green-800">
                        {file.name}
                      </div>
                      <div className="text-xs text-green-600">
                        {(file.size / (1024 * 1024)).toFixed(1)}MB • {file.type}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFileRemove(file)}
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
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
