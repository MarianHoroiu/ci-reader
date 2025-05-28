/**
 * API Response formatting utilities
 * Provides consistent response formatting for AI vision processing endpoints
 */

import type {
  AIVisionOCRResponse,
  RomanianIDExtractionResult,
  AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';
import { AI_VISION_ERROR_CODES } from '@/lib/types/romanian-id-types';

export interface ResponseMetadata {
  /** Request ID for tracking */
  request_id: string;
  /** Processing timestamp */
  timestamp: string;
  /** Total processing time in milliseconds */
  processing_time: number;
  /** Model performance metrics */
  performance?: {
    /** Model response time */
    model_response_time: number;
    /** Image preprocessing time */
    preprocessing_time: number;
    /** Response parsing time */
    parsing_time: number;
  };
}

export interface ErrorDetails {
  /** Error code for programmatic handling */
  code: AIVisionErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Creates a successful AI vision OCR response
 */
export function createSuccessResponse(
  data: RomanianIDExtractionResult,
  metadata: ResponseMetadata
): AIVisionOCRResponse {
  return {
    success: true,
    data,
    metadata,
  };
}

/**
 * Creates an error AI vision OCR response
 */
export function createErrorResponse(
  error: ErrorDetails,
  metadata: Partial<ResponseMetadata>
): AIVisionOCRResponse {
  const fullMetadata: ResponseMetadata = {
    request_id: metadata.request_id || generateRequestId(),
    timestamp: metadata.timestamp || new Date().toISOString(),
    processing_time: metadata.processing_time || 0,
    ...(metadata.performance && { performance: metadata.performance }),
  };

  return {
    success: false,
    error,
    metadata: fullMetadata,
  };
}

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Formats error messages for different error codes
 */
export function formatErrorMessage(
  code: AIVisionErrorCode,
  details?: Record<string, any>
): string {
  switch (code) {
    case 'INVALID_IMAGE':
      return 'The uploaded image is invalid or corrupted. Please upload a clear image of a Romanian ID card.';

    case 'IMAGE_TOO_LARGE': {
      const sizeMB = details?.size
        ? Math.round(details.size / 1024 / 1024)
        : 'unknown';
      return `Image file is too large (${sizeMB}MB). Please upload an image smaller than 10MB.`;
    }

    case 'UNSUPPORTED_FORMAT': {
      const format = details?.format || 'unknown';
      return `Unsupported image format: ${format}. Please upload a JPEG, PNG, WebP, or HEIC image.`;
    }

    case 'MODEL_UNAVAILABLE':
      return 'AI model is currently unavailable. Please try again later or contact support.';

    case 'PROCESSING_TIMEOUT':
      return 'Image processing timed out. Please try with a smaller or clearer image.';

    case 'EXTRACTION_FAILED':
      return 'Failed to extract data from the Romanian ID. Please ensure the image is clear and shows the complete document.';

    case 'INVALID_RESPONSE':
      return 'AI model returned an invalid response. Please try again or contact support.';

    case 'INTERNAL_ERROR':
    default:
      return 'An internal error occurred during processing. Please try again later.';
  }
}

/**
 * Creates error details with formatted message
 */
export function createErrorDetails(
  code: AIVisionErrorCode,
  customMessage?: string,
  details?: Record<string, any>
): ErrorDetails {
  const errorDetails: ErrorDetails = {
    code,
    message: customMessage || formatErrorMessage(code, details),
  };

  if (details !== undefined) {
    errorDetails.details = details;
  }

  return errorDetails;
}

/**
 * Validates response data before sending
 */
export function validateResponseData(data: RomanianIDExtractionResult): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if fields object exists
  if (!data.fields) {
    issues.push('Missing fields object');
  }

  // Check if confidence object exists
  if (!data.confidence) {
    issues.push('Missing confidence object');
  }

  // Check if overall confidence exists
  if (!data.overall_confidence) {
    issues.push('Missing overall confidence');
  }

  // Check if metadata exists
  if (!data.metadata) {
    issues.push('Missing metadata');
  } else {
    if (typeof data.metadata.processing_time !== 'number') {
      issues.push('Invalid processing time in metadata');
    }
    if (!data.metadata.model) {
      issues.push('Missing model information in metadata');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Sanitizes response data for security
 */
export function sanitizeResponseData(
  data: RomanianIDExtractionResult
): RomanianIDExtractionResult {
  // Create a deep copy to avoid modifying original data
  const sanitized = JSON.parse(JSON.stringify(data));

  // Remove any potentially sensitive debugging information
  if (sanitized.metadata.warnings) {
    sanitized.metadata.warnings = sanitized.metadata.warnings.filter(
      (warning: string) => !warning.toLowerCase().includes('debug')
    );
  }

  return sanitized;
}

/**
 * Calculates response size for monitoring
 */
export function calculateResponseSize(response: AIVisionOCRResponse): number {
  return JSON.stringify(response).length;
}

/**
 * Creates performance metrics object
 */
export function createPerformanceMetrics(
  modelTime: number,
  preprocessingTime: number = 0,
  parsingTime: number = 0
): NonNullable<ResponseMetadata['performance']> {
  return {
    model_response_time: modelTime,
    preprocessing_time: preprocessingTime,
    parsing_time: parsingTime,
  };
}

/**
 * Logs response for monitoring and debugging
 */
export function logResponse(
  response: AIVisionOCRResponse,
  requestInfo?: {
    ip?: string;
    userAgent?: string;
    fileSize?: number;
  }
): void {
  const logData = {
    request_id: response.metadata.request_id,
    success: response.success,
    processing_time: response.metadata.processing_time,
    response_size: calculateResponseSize(response),
    timestamp: response.metadata.timestamp,
    ...requestInfo,
  };

  if (response.success) {
    console.log('[AI Vision] Success:', logData);
  } else {
    console.error('[AI Vision] Error:', {
      ...logData,
      error_code: response.error?.code,
      error_message: response.error?.message,
    });
  }
}

/**
 * Creates a rate limiting response
 */
export function createRateLimitResponse(
  retryAfter: number,
  metadata: Partial<ResponseMetadata>
): AIVisionOCRResponse {
  return createErrorResponse(
    createErrorDetails(
      AI_VISION_ERROR_CODES.PROCESSING_TIMEOUT,
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      { retry_after: retryAfter }
    ),
    metadata
  );
}

/**
 * Creates a maintenance mode response
 */
export function createMaintenanceResponse(
  metadata: Partial<ResponseMetadata>
): AIVisionOCRResponse {
  return createErrorResponse(
    createErrorDetails(
      AI_VISION_ERROR_CODES.MODEL_UNAVAILABLE,
      'AI vision service is temporarily unavailable for maintenance. Please try again later.'
    ),
    metadata
  );
}
