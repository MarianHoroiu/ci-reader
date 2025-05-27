'use client';

import React from 'react';
import {
  VALIDATION_ERROR_CODES,
  type ValidationErrorCode,
} from '@/lib/constants/supported-formats';

export interface ValidationMessageProps {
  /** Error message to display */
  message: string;
  /** Error code for styling and icon selection */
  errorCode?: ValidationErrorCode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show detailed error information */
  showDetails?: boolean;
  /** Detailed validation information */
  details?: {
    mimeTypeValid: boolean;
    extensionValid: boolean;
    signatureValid: boolean;
    sizeValid: boolean;
    detectedMimeType?: string | null;
    reportedMimeType: string;
    issues: string[];
  };
  /** Callback when user dismisses the message */
  onDismiss?: () => void;
}

const getErrorIcon = (errorCode?: ValidationErrorCode): string => {
  switch (errorCode) {
    case VALIDATION_ERROR_CODES.INVALID_MIME_TYPE:
    case VALIDATION_ERROR_CODES.UNSUPPORTED_FORMAT:
      return '🚫';
    case VALIDATION_ERROR_CODES.INVALID_EXTENSION:
      return '📄';
    case VALIDATION_ERROR_CODES.INVALID_SIGNATURE:
    case VALIDATION_ERROR_CODES.CORRUPTED_FILE:
      return '⚠️';
    case VALIDATION_ERROR_CODES.FILE_TOO_LARGE:
      return '📏';
    case VALIDATION_ERROR_CODES.NO_FILE:
      return '📁';
    default:
      return '❌';
  }
};

const getErrorSeverity = (
  errorCode?: ValidationErrorCode
): 'error' | 'warning' => {
  switch (errorCode) {
    case VALIDATION_ERROR_CODES.INVALID_SIGNATURE:
    case VALIDATION_ERROR_CODES.CORRUPTED_FILE:
      return 'warning';
    default:
      return 'error';
  }
};

const ValidationMessage: React.FC<ValidationMessageProps> = ({
  message,
  errorCode,
  className = '',
  showDetails = false,
  details,
  onDismiss,
}) => {
  const severity = getErrorSeverity(errorCode);
  const icon = getErrorIcon(errorCode);

  const baseClasses = `
    flex items-start gap-3 p-4 rounded-lg border text-sm
    ${
      severity === 'error'
        ? 'bg-red-50 border-red-200 text-red-800'
        : 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  `;

  return (
    <div className={`${baseClasses} ${className}`} role="alert">
      <span className="text-lg flex-shrink-0" aria-hidden="true">
        {icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="font-medium mb-1">{message}</div>

        {showDetails && details && (
          <div className="mt-2 space-y-1">
            <div className="text-xs opacity-75">Validation Details:</div>
            <ul className="text-xs space-y-1 ml-4">
              <li
                className={`flex items-center gap-2 ${details.mimeTypeValid ? 'text-green-600' : 'text-red-600'}`}
              >
                <span>{details.mimeTypeValid ? '✓' : '✗'}</span>
                MIME Type: {details.reportedMimeType}
                {details.detectedMimeType &&
                  details.detectedMimeType !== details.reportedMimeType && (
                    <span className="text-gray-500">
                      (detected: {details.detectedMimeType})
                    </span>
                  )}
              </li>
              <li
                className={`flex items-center gap-2 ${details.extensionValid ? 'text-green-600' : 'text-red-600'}`}
              >
                <span>{details.extensionValid ? '✓' : '✗'}</span>
                File Extension
              </li>
              <li
                className={`flex items-center gap-2 ${details.signatureValid ? 'text-green-600' : 'text-red-600'}`}
              >
                <span>{details.signatureValid ? '✓' : '✗'}</span>
                File Signature
              </li>
              <li
                className={`flex items-center gap-2 ${details.sizeValid ? 'text-green-600' : 'text-red-600'}`}
              >
                <span>{details.sizeValid ? '✓' : '✗'}</span>
                File Size
              </li>
            </ul>

            {details.issues.length > 0 && (
              <div className="mt-2">
                <div className="text-xs opacity-75 mb-1">Issues:</div>
                <ul className="text-xs space-y-1 ml-4">
                  {details.issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Helpful suggestions based on error type */}
        {errorCode === VALIDATION_ERROR_CODES.INVALID_MIME_TYPE && (
          <div className="mt-2 text-xs opacity-75">
            💡 Supported formats: JPG, PNG, WEBP, PDF
          </div>
        )}

        {errorCode === VALIDATION_ERROR_CODES.FILE_TOO_LARGE && (
          <div className="mt-2 text-xs opacity-75">
            💡 Try compressing your image or using a different file
          </div>
        )}

        {errorCode === VALIDATION_ERROR_CODES.INVALID_SIGNATURE && (
          <div className="mt-2 text-xs opacity-75">
            💡 The file may be corrupted or have an incorrect extension
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded-md transition-colors
            ${
              severity === 'error'
                ? 'hover:bg-red-100 text-red-600'
                : 'hover:bg-yellow-100 text-yellow-600'
            }
          `}
          aria-label="Dismiss error message"
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
      )}
    </div>
  );
};

export default ValidationMessage;
