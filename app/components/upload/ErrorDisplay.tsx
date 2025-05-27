'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getFormattedErrorMessage,
  getErrorCategory,
  isRecoverableError,
  type ErrorContext,
} from '@/lib/constants/error-messages';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';

export interface ErrorDisplayProps {
  /** Error code for the validation failure */
  errorCode: ValidationErrorCode;
  /** Additional context about the error */
  context?: ErrorContext | undefined;
  /** Whether to show detailed error information */
  showDetails?: boolean;
  /** Whether to show recovery suggestions */
  showSuggestions?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when user dismisses the error */
  onDismiss?: () => void;
  /** Callback when user clicks a recovery action */
  onRecoveryAction?: (_action: string) => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorCode,
  context,
  showDetails = true,
  showSuggestions = true,
  className = '',
  onDismiss,
  onRecoveryAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const errorInfo = getFormattedErrorMessage(errorCode, context);
  const category = getErrorCategory(errorCode);
  const recoverable = isRecoverableError(errorCode);

  const getSeverityStyles = () => {
    switch (errorInfo.severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = () => {
    switch (errorInfo.severity) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border p-4 ${getSeverityStyles()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={`text-xl flex-shrink-0 ${getIconColor()}`}
          aria-hidden="true"
        >
          {errorInfo.icon}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm">
                {errorInfo.formattedMessage}
              </h3>
              {errorInfo.description && (
                <p className="text-sm opacity-90 mt-1">
                  {errorInfo.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {/* Category badge */}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-50">
                {category}
              </span>

              {/* Recoverable indicator */}
              {recoverable && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Recoverable
                </span>
              )}
            </div>
          </div>

          {/* Context information */}
          {context && showDetails && (
            <div className="mt-3 text-xs opacity-75">
              <div className="grid grid-cols-2 gap-2">
                {context.fileName && (
                  <div>
                    <span className="font-medium">File:</span>{' '}
                    {context.fileName}
                  </div>
                )}
                {context.fileSize && (
                  <div>
                    <span className="font-medium">Size:</span>{' '}
                    {(context.fileSize / (1024 * 1024)).toFixed(1)}MB
                  </div>
                )}
                {context.reportedMimeType && (
                  <div>
                    <span className="font-medium">Type:</span>{' '}
                    {context.reportedMimeType}
                  </div>
                )}
                {context.detectedMimeType &&
                  context.detectedMimeType !== context.reportedMimeType && (
                    <div>
                      <span className="font-medium">Detected:</span>{' '}
                      {context.detectedMimeType}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Recovery suggestions */}
          {showSuggestions && errorInfo.contextualSuggestions.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm font-medium hover:underline focus:outline-none focus:underline"
              >
                <span>Recovery Suggestions</span>
                <motion.svg
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-2 space-y-2">
                      {errorInfo.contextualSuggestions.map(
                        (suggestion, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-green-500 flex-shrink-0 mt-0.5">
                              •
                            </span>
                            <span>{suggestion}</span>
                            {onRecoveryAction && (
                              <button
                                onClick={() => onRecoveryAction(suggestion)}
                                className="ml-auto text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded"
                              >
                                Try this
                              </button>
                            )}
                          </motion.li>
                        )
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-white hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current"
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
    </motion.div>
  );
};

export default ErrorDisplay;
