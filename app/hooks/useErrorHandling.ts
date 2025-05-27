'use client';

import { useState, useCallback, useRef } from 'react';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';
import { type ErrorContext } from '@/lib/constants/error-messages';

export interface ErrorState {
  /** Current error code */
  errorCode: ValidationErrorCode | null;
  /** Error context information */
  context?: ErrorContext;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Unique error ID for tracking */
  id: string;
}

export interface ErrorLogEntry extends ErrorState {
  /** Whether the error was dismissed by user */
  dismissed: boolean;
  /** How long the error was displayed (in ms) */
  displayDuration?: number;
}

export interface UseErrorHandlingOptions {
  /** Maximum number of errors to keep in log */
  maxLogEntries?: number;
  /** Whether to automatically log errors to console */
  enableConsoleLogging?: boolean;
  /** Callback when error occurs */
  onError?: (_error: ErrorState) => void;
  /** Callback when error is dismissed */
  onErrorDismissed?: (_error: ErrorLogEntry) => void;
}

export interface UseErrorHandlingReturn {
  /** Current error state */
  currentError: ErrorState | null;
  /** Error log history */
  errorLog: ErrorLogEntry[];
  /** Whether there's an active error */
  hasError: boolean;
  /** Number of errors in current session */
  errorCount: number;

  /** Show an error */
  showError: (
    _errorCode: ValidationErrorCode,
    _context?: ErrorContext
  ) => string;
  /** Dismiss current error */
  dismissError: () => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Get error by ID */
  getErrorById: (_id: string) => ErrorLogEntry | null;
  /** Get errors by category */
  getErrorsByCategory: (_category: string) => ErrorLogEntry[];
  /** Export error log for debugging */
  exportErrorLog: () => string;
}

export function useErrorHandling(
  options: UseErrorHandlingOptions = {}
): UseErrorHandlingReturn {
  const {
    maxLogEntries = 50,
    enableConsoleLogging = true,
    onError,
    onErrorDismissed,
  } = options;

  const [currentError, setCurrentError] = useState<ErrorState | null>(null);
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);
  const errorStartTime = useRef<number | null>(null);

  // Generate unique error ID
  const generateErrorId = useCallback((): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Log error to console if enabled
  const logToConsole = useCallback(
    (error: ErrorState) => {
      if (enableConsoleLogging) {
        console.group(`🚨 File Validation Error: ${error.errorCode}`);
        console.error('Error Code:', error.errorCode);
        console.error('Context:', error.context);
        console.error('Timestamp:', new Date(error.timestamp).toISOString());
        console.error('Error ID:', error.id);
        console.groupEnd();
      }
    },
    [enableConsoleLogging]
  );

  // Show an error
  const showError = useCallback(
    (errorCode: ValidationErrorCode, context?: ErrorContext): string => {
      const errorState: ErrorState = {
        errorCode,
        ...(context && { context }),
        timestamp: Date.now(),
        id: generateErrorId(),
      };

      setCurrentError(errorState);
      errorStartTime.current = Date.now();

      // Log to console
      logToConsole(errorState);

      // Call callback
      onError?.(errorState);

      return errorState.id;
    },
    [generateErrorId, logToConsole, onError]
  );

  // Dismiss current error
  const dismissError = useCallback(() => {
    if (currentError) {
      const displayDuration = errorStartTime.current
        ? Date.now() - errorStartTime.current
        : undefined;

      const logEntry: ErrorLogEntry = {
        ...currentError,
        dismissed: true,
        ...(displayDuration !== undefined && { displayDuration }),
      };

      // Add to error log
      setErrorLog(prev => {
        const newLog = [logEntry, ...prev];
        // Keep only the most recent entries
        return newLog.slice(0, maxLogEntries);
      });

      // Clear current error
      setCurrentError(null);
      errorStartTime.current = null;

      // Call callback
      onErrorDismissed?.(logEntry);
    }
  }, [currentError, maxLogEntries, onErrorDismissed]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setCurrentError(null);
    setErrorLog([]);
    errorStartTime.current = null;
  }, []);

  // Get error by ID
  const getErrorById = useCallback(
    (id: string): ErrorLogEntry | null => {
      return errorLog.find(error => error.id === id) || null;
    },
    [errorLog]
  );

  // Get errors by category
  const getErrorsByCategory = useCallback(
    (category: string): ErrorLogEntry[] => {
      // This would need to import getErrorCategory from error-messages
      // For now, we'll filter by error code patterns
      const categoryPatterns: Record<string, string[]> = {
        FORMAT: [
          'INVALID_MIME_TYPE',
          'INVALID_EXTENSION',
          'UNSUPPORTED_FORMAT',
        ],
        SIZE: ['FILE_TOO_LARGE'],
        CORRUPTION: ['INVALID_SIGNATURE', 'CORRUPTED_FILE'],
        MISSING: ['NO_FILE'],
      };

      const patterns = categoryPatterns[category] || [];
      return errorLog.filter(
        error => error.errorCode && patterns.includes(error.errorCode)
      );
    },
    [errorLog]
  );

  // Export error log for debugging
  const exportErrorLog = useCallback((): string => {
    const exportData = {
      timestamp: new Date().toISOString(),
      currentError,
      errorLog,
      summary: {
        totalErrors: errorLog.length,
        currentErrorActive: !!currentError,
        averageDisplayDuration:
          errorLog
            .filter(e => e.displayDuration)
            .reduce((sum, e) => sum + (e.displayDuration || 0), 0) /
            errorLog.filter(e => e.displayDuration).length || 0,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }, [currentError, errorLog]);

  return {
    // State
    currentError,
    errorLog,
    hasError: !!currentError,
    errorCount: errorLog.length,

    // Actions
    showError,
    dismissError,
    clearAllErrors,
    getErrorById,
    getErrorsByCategory,
    exportErrorLog,
  };
}
