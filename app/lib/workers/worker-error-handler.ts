/**
 * Error handling utilities for Web Worker operations
 * Provides error classification, recovery strategies, and logging
 */

import type { OCRError } from '../ocr/ocr-types';

// Error categories for classification
export enum WorkerErrorCategory {
  INITIALIZATION = 'INITIALIZATION',
  PROCESSING = 'PROCESSING',
  COMMUNICATION = 'COMMUNICATION',
  TIMEOUT = 'TIMEOUT',
  MEMORY = 'MEMORY',
  BROWSER_COMPATIBILITY = 'BROWSER_COMPATIBILITY',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum WorkerErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Recovery strategies
export enum WorkerRecoveryStrategy {
  RETRY = 'RETRY',
  RESTART_WORKER = 'RESTART_WORKER',
  FALLBACK_TO_MAIN_THREAD = 'FALLBACK_TO_MAIN_THREAD',
  REDUCE_QUALITY = 'REDUCE_QUALITY',
  NO_RECOVERY = 'NO_RECOVERY',
}

// Enhanced error interface
export interface WorkerError extends OCRError {
  category: WorkerErrorCategory;
  severity: WorkerErrorSeverity;
  recoveryStrategy: WorkerRecoveryStrategy;
  workerId?: string | undefined;
  jobId?: string | undefined;
  retryCount?: number | undefined;
  maxRetries?: number | undefined;
  context?: Record<string, unknown> | undefined;
}

// Error classification rules
const ERROR_CLASSIFICATION_RULES = [
  {
    pattern: /worker.*not.*supported/i,
    category: WorkerErrorCategory.BROWSER_COMPATIBILITY,
    severity: WorkerErrorSeverity.CRITICAL,
    recoveryStrategy: WorkerRecoveryStrategy.FALLBACK_TO_MAIN_THREAD,
  },
  {
    pattern: /timeout|timed.*out/i,
    category: WorkerErrorCategory.TIMEOUT,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RETRY,
  },
  {
    pattern: /memory|out.*of.*memory/i,
    category: WorkerErrorCategory.MEMORY,
    severity: WorkerErrorSeverity.HIGH,
    recoveryStrategy: WorkerRecoveryStrategy.REDUCE_QUALITY,
  },
  {
    pattern: /initialization.*failed|failed.*initialize/i,
    category: WorkerErrorCategory.INITIALIZATION,
    severity: WorkerErrorSeverity.HIGH,
    recoveryStrategy: WorkerRecoveryStrategy.RESTART_WORKER,
  },
  {
    pattern: /network|fetch|download/i,
    category: WorkerErrorCategory.NETWORK,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RETRY,
  },
  {
    pattern: /postmessage|message.*failed/i,
    category: WorkerErrorCategory.COMMUNICATION,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RESTART_WORKER,
  },
  {
    pattern: /processing.*failed|ocr.*failed/i,
    category: WorkerErrorCategory.PROCESSING,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RETRY,
  },
];

/**
 * Classify error and determine recovery strategy
 */
export function classifyWorkerError(error: Error | OCRError): WorkerError {
  const message = error.message || '';
  const details = 'details' in error ? error.details || '' : '';
  const searchText = `${message} ${details}`.toLowerCase();

  // Find matching classification rule
  const rule = ERROR_CLASSIFICATION_RULES.find(rule =>
    rule.pattern.test(searchText)
  );

  const baseError: OCRError =
    'code' in error
      ? (error as OCRError)
      : {
          code: 'WORKER_ERROR',
          message: error.message,
          details: error.stack || '',
          recoverable: true,
          timestamp: new Date(),
        };

  return {
    ...baseError,
    category: rule?.category || WorkerErrorCategory.UNKNOWN,
    severity: rule?.severity || WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: rule?.recoveryStrategy || WorkerRecoveryStrategy.RETRY,
    retryCount: 0,
    maxRetries: getMaxRetriesForStrategy(
      rule?.recoveryStrategy || WorkerRecoveryStrategy.RETRY
    ),
  };
}

/**
 * Get maximum retries for a recovery strategy
 */
function getMaxRetriesForStrategy(strategy: WorkerRecoveryStrategy): number {
  switch (strategy) {
    case WorkerRecoveryStrategy.RETRY:
      return 3;
    case WorkerRecoveryStrategy.RESTART_WORKER:
      return 2;
    case WorkerRecoveryStrategy.REDUCE_QUALITY:
      return 1;
    case WorkerRecoveryStrategy.FALLBACK_TO_MAIN_THREAD:
      return 0;
    case WorkerRecoveryStrategy.NO_RECOVERY:
      return 0;
    default:
      return 1;
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: WorkerError): boolean {
  if (!error.recoverable) return false;
  if (error.severity === WorkerErrorSeverity.CRITICAL) return false;
  if (error.retryCount !== undefined && error.maxRetries !== undefined) {
    return error.retryCount < error.maxRetries;
  }
  return true;
}

/**
 * Increment retry count for error
 */
export function incrementRetryCount(error: WorkerError): WorkerError {
  return {
    ...error,
    retryCount: (error.retryCount || 0) + 1,
  };
}

/**
 * Create timeout error
 */
export function createTimeoutError(
  operation: string,
  timeoutMs: number,
  workerId?: string,
  jobId?: string
): WorkerError {
  return {
    code: 'WORKER_TIMEOUT',
    message: `${operation} timed out after ${timeoutMs}ms`,
    details: `Worker operation exceeded timeout limit`,
    recoverable: true,
    timestamp: new Date(),
    category: WorkerErrorCategory.TIMEOUT,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RETRY,
    workerId,
    jobId,
    retryCount: 0,
    maxRetries: 3,
    context: { operation, timeoutMs },
  };
}

/**
 * Create initialization error
 */
export function createInitializationError(
  message: string,
  details?: string,
  workerId?: string
): WorkerError {
  return {
    code: 'WORKER_INITIALIZATION_FAILED',
    message,
    details,
    recoverable: true,
    timestamp: new Date(),
    category: WorkerErrorCategory.INITIALIZATION,
    severity: WorkerErrorSeverity.HIGH,
    recoveryStrategy: WorkerRecoveryStrategy.RESTART_WORKER,
    workerId,
    retryCount: 0,
    maxRetries: 2,
  };
}

/**
 * Create communication error
 */
export function createCommunicationError(
  message: string,
  details?: string,
  workerId?: string,
  jobId?: string
): WorkerError {
  return {
    code: 'WORKER_COMMUNICATION_FAILED',
    message,
    details,
    recoverable: true,
    timestamp: new Date(),
    category: WorkerErrorCategory.COMMUNICATION,
    severity: WorkerErrorSeverity.MEDIUM,
    recoveryStrategy: WorkerRecoveryStrategy.RESTART_WORKER,
    workerId,
    jobId,
    retryCount: 0,
    maxRetries: 2,
  };
}

/**
 * Create browser compatibility error
 */
export function createCompatibilityError(
  feature: string,
  details?: string
): WorkerError {
  return {
    code: 'BROWSER_COMPATIBILITY_ERROR',
    message: `Browser does not support ${feature}`,
    details,
    recoverable: false,
    timestamp: new Date(),
    category: WorkerErrorCategory.BROWSER_COMPATIBILITY,
    severity: WorkerErrorSeverity.CRITICAL,
    recoveryStrategy: WorkerRecoveryStrategy.FALLBACK_TO_MAIN_THREAD,
    retryCount: 0,
    maxRetries: 0,
    context: { feature },
  };
}

/**
 * Create memory error
 */
export function createMemoryError(
  message: string,
  memoryUsage?: number,
  workerId?: string,
  jobId?: string
): WorkerError {
  return {
    code: 'WORKER_MEMORY_ERROR',
    message,
    details: `Memory usage: ${memoryUsage ? `${memoryUsage} bytes` : 'unknown'}`,
    recoverable: true,
    timestamp: new Date(),
    category: WorkerErrorCategory.MEMORY,
    severity: WorkerErrorSeverity.HIGH,
    recoveryStrategy: WorkerRecoveryStrategy.REDUCE_QUALITY,
    workerId,
    jobId,
    retryCount: 0,
    maxRetries: 1,
    context: { memoryUsage },
  };
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: WorkerError): string {
  const parts = [
    `[${error.category}/${error.severity}]`,
    error.code,
    error.message,
  ];

  if (error.workerId) {
    parts.push(`Worker: ${error.workerId}`);
  }

  if (error.jobId) {
    parts.push(`Job: ${error.jobId}`);
  }

  if (error.retryCount !== undefined) {
    parts.push(`Retry: ${error.retryCount}/${error.maxRetries}`);
  }

  if (error.details) {
    parts.push(`Details: ${error.details}`);
  }

  return parts.join(' | ');
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: WorkerError): string {
  switch (error.category) {
    case WorkerErrorCategory.BROWSER_COMPATIBILITY:
      return 'Your browser does not support this feature. Please try using a modern browser.';

    case WorkerErrorCategory.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';

    case WorkerErrorCategory.MEMORY:
      return 'Not enough memory to process this image. Try using a smaller image or close other browser tabs.';

    case WorkerErrorCategory.TIMEOUT:
      return 'The operation is taking longer than expected. Please try again.';

    case WorkerErrorCategory.INITIALIZATION:
      return 'Failed to initialize the text recognition engine. Please refresh the page and try again.';

    case WorkerErrorCategory.PROCESSING:
      return 'Failed to process the image. Please try with a different image or check the image quality.';

    case WorkerErrorCategory.COMMUNICATION:
      return 'Communication error occurred. Please refresh the page and try again.';

    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

/**
 * Log error with appropriate level
 */
export function logWorkerError(error: WorkerError): void {
  const formattedError = formatErrorForLogging(error);

  switch (error.severity) {
    case WorkerErrorSeverity.CRITICAL:
      console.error('🔴 CRITICAL WORKER ERROR:', formattedError);
      break;
    case WorkerErrorSeverity.HIGH:
      console.error('🟠 HIGH WORKER ERROR:', formattedError);
      break;
    case WorkerErrorSeverity.MEDIUM:
      console.warn('🟡 MEDIUM WORKER ERROR:', formattedError);
      break;
    case WorkerErrorSeverity.LOW:
      console.info('🔵 LOW WORKER ERROR:', formattedError);
      break;
    default:
      console.log('⚪ WORKER ERROR:', formattedError);
  }
}

/**
 * Create error recovery plan
 */
export interface ErrorRecoveryPlan {
  strategy: WorkerRecoveryStrategy;
  shouldRetry: boolean;
  delayMs: number;
  modifications?: {
    reduceImageQuality?: boolean;
    useMainThread?: boolean;
    restartWorker?: boolean;
    changeLanguage?: string;
  };
}

/**
 * Generate recovery plan for error
 */
export function generateRecoveryPlan(error: WorkerError): ErrorRecoveryPlan {
  const shouldRetry = isRecoverableError(error);
  const retryCount = error.retryCount || 0;

  // Calculate exponential backoff delay
  const baseDelay = 1000; // 1 second
  const delayMs = Math.min(baseDelay * Math.pow(2, retryCount), 10000); // Max 10 seconds

  const plan: ErrorRecoveryPlan = {
    strategy: error.recoveryStrategy,
    shouldRetry,
    delayMs,
  };

  switch (error.recoveryStrategy) {
    case WorkerRecoveryStrategy.REDUCE_QUALITY:
      plan.modifications = {
        reduceImageQuality: true,
      };
      break;

    case WorkerRecoveryStrategy.FALLBACK_TO_MAIN_THREAD:
      plan.modifications = {
        useMainThread: true,
      };
      break;

    case WorkerRecoveryStrategy.RESTART_WORKER:
      plan.modifications = {
        restartWorker: true,
      };
      break;

    case WorkerRecoveryStrategy.RETRY:
      // No modifications needed for simple retry
      break;

    case WorkerRecoveryStrategy.NO_RECOVERY:
      plan.shouldRetry = false;
      break;
  }

  return plan;
}
