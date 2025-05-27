/**
 * Core file type validation logic for Romanian ID document processing
 * Combines MIME type checking, file extension validation, and file signature verification
 */

import {
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
  VALIDATION_ERROR_CODES,
  ERROR_MESSAGES,
  type ValidationErrorCode,
} from '@/lib/constants/supported-formats';
import { verifyFileSignatures } from '@/lib/utils/file-signature';
import {
  comprehensiveMimeTypeValidation,
  validateMimeTypeWithExtension,
  isSupportedMimeType,
} from '@/lib/validation/mime-type-detector';

export interface FileValidationResult {
  /** Whether the file passed all validation checks */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: ValidationErrorCode;
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
}

export interface BatchValidationResult {
  /** Files that passed validation */
  validFiles: File[];
  /** Files that failed validation with error details */
  invalidFiles: Array<{
    file: File;
    error: string;
    errorCode: ValidationErrorCode;
    details?: FileValidationResult['details'];
  }>;
  /** Summary statistics */
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Validates a single file with comprehensive checks
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.NO_FILE],
      errorCode: VALIDATION_ERROR_CODES.NO_FILE,
    };
  }

  // Check file size first (quick check)
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.FILE_TOO_LARGE],
      errorCode: VALIDATION_ERROR_CODES.FILE_TOO_LARGE,
      details: {
        mimeTypeValid: false,
        extensionValid: false,
        signatureValid: false,
        sizeValid: false,
        reportedMimeType: file.type,
        issues: ['File size exceeds 10MB limit'],
      },
    };
  }

  // Check if file size is reasonable (not empty)
  if (file.size === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.CORRUPTED_FILE],
      errorCode: VALIDATION_ERROR_CODES.CORRUPTED_FILE,
      details: {
        mimeTypeValid: false,
        extensionValid: false,
        signatureValid: false,
        sizeValid: false,
        reportedMimeType: file.type,
        issues: ['File is empty'],
      },
    };
  }

  // Comprehensive MIME type validation
  const mimeValidation = await comprehensiveMimeTypeValidation(file);

  // Quick MIME type check
  if (!isSupportedMimeType(file.type)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.INVALID_MIME_TYPE],
      errorCode: VALIDATION_ERROR_CODES.INVALID_MIME_TYPE,
      details: {
        mimeTypeValid: false,
        extensionValid: false,
        signatureValid: false,
        sizeValid: true,
        reportedMimeType: file.type,
        detectedMimeType: mimeValidation.detectedMimeType,
        issues: ['Unsupported MIME type'],
      },
    };
  }

  // File extension validation
  const extensionValid = validateMimeTypeWithExtension(file.type, file.name);

  // File signature validation
  const format = SUPPORTED_FORMATS[file.type];
  let signatureValid = false;

  if (format) {
    try {
      signatureValid = await verifyFileSignatures(file, format.signatures);
    } catch {
      signatureValid = false;
    }
  }

  // Collect validation details
  const details = {
    mimeTypeValid: mimeValidation.isValid,
    extensionValid,
    signatureValid,
    sizeValid: true,
    reportedMimeType: file.type,
    detectedMimeType: mimeValidation.detectedMimeType,
    issues: mimeValidation.issues,
  };

  // Determine overall validation result
  if (!mimeValidation.isValid) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.INVALID_MIME_TYPE],
      errorCode: VALIDATION_ERROR_CODES.INVALID_MIME_TYPE,
      details,
    };
  }

  if (!extensionValid) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.INVALID_EXTENSION],
      errorCode: VALIDATION_ERROR_CODES.INVALID_EXTENSION,
      details,
    };
  }

  if (!signatureValid) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.INVALID_SIGNATURE],
      errorCode: VALIDATION_ERROR_CODES.INVALID_SIGNATURE,
      details,
    };
  }

  // All validations passed
  return {
    isValid: true,
    details,
  };
}

/**
 * Validates multiple files with batch processing
 */
export async function validateFiles(
  files: File[]
): Promise<BatchValidationResult> {
  const validFiles: File[] = [];
  const invalidFiles: BatchValidationResult['invalidFiles'] = [];

  // Process files in parallel for better performance
  const validationPromises = files.map(async file => {
    const result = await validateFile(file);
    return { file, result };
  });

  const results = await Promise.all(validationPromises);

  // Categorize results
  results.forEach(({ file, result }) => {
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        error: result.error!,
        errorCode: result.errorCode!,
        details: result.details,
      });
    }
  });

  return {
    validFiles,
    invalidFiles,
    summary: {
      total: files.length,
      valid: validFiles.length,
      invalid: invalidFiles.length,
    },
  };
}

/**
 * Quick validation for performance-critical scenarios
 * Only checks MIME type and file size
 */
export function validateFileQuick(file: File): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.NO_FILE],
      errorCode: VALIDATION_ERROR_CODES.NO_FILE,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.FILE_TOO_LARGE],
      errorCode: VALIDATION_ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  if (!isSupportedMimeType(file.type)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[VALIDATION_ERROR_CODES.INVALID_MIME_TYPE],
      errorCode: VALIDATION_ERROR_CODES.INVALID_MIME_TYPE,
    };
  }

  return { isValid: true };
}

/**
 * Validates file with caching for repeated checks
 */
const validationCache = new Map<string, FileValidationResult>();

export async function validateFileWithCache(
  file: File
): Promise<FileValidationResult> {
  // Create cache key from file properties
  const cacheKey = `${file.name}_${file.size}_${file.lastModified}_${file.type}`;

  // Check cache first
  const cached = validationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Perform validation
  const result = await validateFile(file);

  // Cache result (limit cache size to prevent memory leaks)
  if (validationCache.size < 100) {
    validationCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Clears the validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Gets validation statistics for a batch of files
 */
export function getValidationStats(results: BatchValidationResult) {
  const errorCounts: Record<string, number> = {};

  results.invalidFiles.forEach(({ errorCode }) => {
    errorCounts[errorCode] = (errorCounts[errorCode] || 0) + 1;
  });

  return {
    ...results.summary,
    errorBreakdown: errorCounts,
    successRate:
      results.summary.total > 0
        ? (results.summary.valid / results.summary.total) * 100
        : 0,
  };
}
