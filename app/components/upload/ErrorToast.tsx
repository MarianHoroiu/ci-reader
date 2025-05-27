'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';
import {
  getFormattedErrorMessage,
  type ErrorContext,
} from '@/lib/constants/error-messages';

export interface ErrorToastProps {
  /** Whether the toast is visible */
  isVisible: boolean;
  /** Error code for the validation failure */
  errorCode: ValidationErrorCode;
  /** Additional context about the error */
  context?: ErrorContext | undefined;
  /** Auto-dismiss timeout in milliseconds (0 to disable) */
  autoHideDuration?: number;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Position of the toast */
  position?: 'top' | 'bottom';
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  isVisible,
  errorCode,
  context,
  autoHideDuration = 5000,
  onDismiss,
  position = 'top',
}) => {
  const errorInfo = getFormattedErrorMessage(errorCode, context);

  // Auto-dismiss functionality
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoHideDuration, onDismiss]);

  const getSeverityStyles = () => {
    switch (errorInfo.severity) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPositionStyles = () => {
    return position === 'top'
      ? 'top-4 left-1/2 transform -translate-x-1/2'
      : 'bottom-4 left-1/2 transform -translate-x-1/2';
  };

  const getAnimationProps = () => {
    return position === 'top'
      ? {
          initial: { opacity: 0, y: -50, scale: 0.9 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: -50, scale: 0.9 },
        }
      : {
          initial: { opacity: 0, y: 50, scale: 0.9 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 50, scale: 0.9 },
        };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={`fixed z-50 ${getPositionStyles()}`}>
          <motion.div
            {...getAnimationProps()}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-md
              ${getSeverityStyles()}
            `}
            role="alert"
            aria-live="assertive"
          >
            <span className="text-lg flex-shrink-0" aria-hidden="true">
              {errorInfo.icon}
            </span>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {errorInfo.formattedMessage}
              </div>
              {context?.fileName && (
                <div className="text-xs opacity-90 mt-1 truncate">
                  File: {context.fileName}
                </div>
              )}
            </div>

            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-md transition-colors hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Dismiss notification"
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

            {/* Progress bar for auto-dismiss */}
            {autoHideDuration > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 rounded-b-lg"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: autoHideDuration / 1000,
                  ease: 'linear',
                }}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ErrorToast;
