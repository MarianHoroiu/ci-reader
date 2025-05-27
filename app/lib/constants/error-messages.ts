/**
 * Comprehensive error messages and recovery suggestions for file upload validation
 * Supports internationalization and provides actionable user guidance
 */

import { type ValidationErrorCode } from '@/lib/constants/supported-formats';

export interface ErrorMessage {
  /** Primary error message */
  message: string;
  /** Detailed explanation of the issue */
  description?: string;
  /** Actionable recovery suggestions */
  suggestions: string[];
  /** Error severity level */
  severity: 'error' | 'warning' | 'info';
  /** Icon to display with the error */
  icon: string;
  /** Whether this error is recoverable */
  recoverable: boolean;
}

export interface ErrorContext {
  /** File name that caused the error */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Detected MIME type */
  detectedMimeType?: string | undefined;
  /** Reported MIME type */
  reportedMimeType?: string;
  /** Additional context information */
  metadata?: Record<string, unknown>;
}

// Comprehensive error messages with recovery suggestions
export const COMPREHENSIVE_ERROR_MESSAGES: Record<
  ValidationErrorCode,
  ErrorMessage
> = {
  NO_FILE: {
    message: 'No file selected',
    description: 'Please select a file to upload.',
    suggestions: [
      'Click the upload area to browse for files',
      'Drag and drop a file into the upload zone',
      'Ensure you have selected a valid Romanian ID document',
    ],
    severity: 'info',
    icon: '📁',
    recoverable: true,
  },

  INVALID_MIME_TYPE: {
    message: 'Unsupported file format',
    description:
      'The selected file format is not supported for Romanian ID document processing.',
    suggestions: [
      'Use JPG, PNG, WEBP, or PDF format',
      'Convert your file to a supported format',
      'Take a new photo of your ID document',
      'Scan your document as PDF or save as JPG/PNG',
    ],
    severity: 'error',
    icon: '🚫',
    recoverable: true,
  },

  INVALID_EXTENSION: {
    message: 'Invalid file extension',
    description: 'The file extension does not match the expected format.',
    suggestions: [
      'Rename the file with the correct extension (.jpg, .png, .webp, .pdf)',
      'Ensure the file is not corrupted',
      'Try saving the file again with the proper extension',
      'Use a different file if the current one is damaged',
    ],
    severity: 'warning',
    icon: '📄',
    recoverable: true,
  },

  INVALID_SIGNATURE: {
    message: 'File appears corrupted or invalid',
    description: 'The file structure does not match its claimed format.',
    suggestions: [
      'Try uploading a different copy of the document',
      'Re-scan or re-photograph your ID document',
      'Check if the file opens correctly in other applications',
      'Ensure the file was not corrupted during transfer',
      'Try converting the file to a different supported format',
    ],
    severity: 'warning',
    icon: '⚠️',
    recoverable: true,
  },

  FILE_TOO_LARGE: {
    message: 'File size too large',
    description: 'The file exceeds the maximum allowed size of 10MB.',
    suggestions: [
      'Compress the image using photo editing software',
      'Reduce image quality or resolution',
      'Take a new photo with lower resolution settings',
      'Use online image compression tools',
      'Crop the image to focus on the ID document only',
    ],
    severity: 'error',
    icon: '📏',
    recoverable: true,
  },

  CORRUPTED_FILE: {
    message: 'File appears to be corrupted',
    description:
      'The file cannot be processed due to corruption or invalid data.',
    suggestions: [
      'Try uploading a different copy of the document',
      'Re-scan or re-photograph your ID document',
      'Check if the file opens in other applications',
      'Ensure the file was completely downloaded/transferred',
      'Try saving the file in a different format',
    ],
    severity: 'error',
    icon: '💥',
    recoverable: true,
  },

  UNSUPPORTED_FORMAT: {
    message: 'Format not supported',
    description:
      'This file format is not supported for Romanian ID document processing.',
    suggestions: [
      'Convert to JPG, PNG, WEBP, or PDF format',
      'Use image editing software to save in a supported format',
      'Take a new photo and save as JPG or PNG',
      'Scan the document as PDF',
    ],
    severity: 'error',
    icon: '❌',
    recoverable: true,
  },
};

// Common recovery actions that can be suggested across different errors
export const RECOVERY_ACTIONS = {
  RETAKE_PHOTO: 'Take a new photo of your ID document',
  RESCAN_DOCUMENT: 'Re-scan your document with better quality',
  COMPRESS_IMAGE: 'Compress the image to reduce file size',
  CONVERT_FORMAT: 'Convert to a supported format (JPG, PNG, WEBP, PDF)',
  CHECK_FILE_INTEGRITY: 'Verify the file is not corrupted',
  USE_DIFFERENT_FILE: 'Try using a different copy of the document',
  CONTACT_SUPPORT: 'Contact support if the problem persists',
} as const;

// Error categories for grouping and filtering
export const ERROR_CATEGORIES = {
  FORMAT: ['INVALID_MIME_TYPE', 'INVALID_EXTENSION', 'UNSUPPORTED_FORMAT'],
  SIZE: ['FILE_TOO_LARGE'],
  CORRUPTION: ['INVALID_SIGNATURE', 'CORRUPTED_FILE'],
  MISSING: ['NO_FILE'],
} as const;

/**
 * Get formatted error message with context
 */
export function getFormattedErrorMessage(
  errorCode: ValidationErrorCode,
  context?: ErrorContext
): ErrorMessage & {
  formattedMessage: string;
  contextualSuggestions: string[];
} {
  const baseError = COMPREHENSIVE_ERROR_MESSAGES[errorCode];

  let formattedMessage = baseError.message;
  const contextualSuggestions = [...baseError.suggestions];

  // Add contextual information to the message
  if (context?.fileName) {
    formattedMessage += ` for "${context.fileName}"`;
  }

  // Add context-specific suggestions
  if (context?.fileSize && errorCode === 'FILE_TOO_LARGE') {
    const sizeMB = (context.fileSize / (1024 * 1024)).toFixed(1);
    formattedMessage += ` (${sizeMB}MB)`;
    contextualSuggestions.unshift(
      `Current size: ${sizeMB}MB, maximum allowed: 10MB`
    );
  }

  if (
    context?.detectedMimeType &&
    context?.reportedMimeType &&
    context.detectedMimeType !== context.reportedMimeType
  ) {
    contextualSuggestions.unshift(
      `File reports as ${context.reportedMimeType} but appears to be ${context.detectedMimeType}`
    );
  }

  return {
    ...baseError,
    formattedMessage,
    contextualSuggestions,
  };
}

/**
 * Get error category for an error code
 */
export function getErrorCategory(errorCode: ValidationErrorCode): string {
  for (const [category, codes] of Object.entries(ERROR_CATEGORIES)) {
    if (codes.includes(errorCode as never)) {
      return category;
    }
  }
  return 'UNKNOWN';
}

/**
 * Check if an error is recoverable
 */
export function isRecoverableError(errorCode: ValidationErrorCode): boolean {
  return COMPREHENSIVE_ERROR_MESSAGES[errorCode]?.recoverable ?? false;
}

/**
 * Get suggested actions for an error
 */
export function getSuggestedActions(errorCode: ValidationErrorCode): string[] {
  return COMPREHENSIVE_ERROR_MESSAGES[errorCode]?.suggestions ?? [];
}
