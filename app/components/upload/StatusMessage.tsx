'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadPhase } from '@/lib/utils/progress-calculator';

export interface StatusMessageProps {
  phase: UploadPhase;
  message?: string | undefined;
  details?: string | undefined;
  variant?: 'default' | 'compact' | 'banner';
  showIcon?: boolean;
  dismissible?: boolean | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string;
}

const phaseConfig = {
  uploading: {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
    defaultMessage: 'Uploading your file...',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  validating: {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    defaultMessage: 'Validating file format and content...',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    textColor: 'text-yellow-800 dark:text-yellow-200',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  compressing: {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
      </svg>
    ),
    defaultMessage: 'Optimizing file size...',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-800 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  complete: {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    defaultMessage: 'Upload completed successfully!',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-800 dark:text-green-200',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    defaultMessage: 'Upload failed. Please try again.',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  cancelled: {
    icon: (
      <svg
        className="w-5 h-5"
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
    ),
    defaultMessage: 'Upload was cancelled.',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-800 dark:text-gray-200',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

export default function StatusMessage({
  phase,
  message,
  details,
  variant = 'default',
  showIcon = true,
  dismissible = false,
  onDismiss,
  className = '',
}: StatusMessageProps) {
  const config = phaseConfig[phase];
  const displayMessage = message || config.defaultMessage;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-md
          ${config.bgColor} ${config.borderColor} border
          ${className}
        `}
      >
        {showIcon && (
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor} truncate`}>
            {displayMessage}
          </p>
        </div>

        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`
              flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5
              ${config.iconColor} hover:opacity-75 transition-opacity
            `}
            aria-label="Dismiss message"
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
      </motion.div>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          relative px-4 py-3 rounded-lg border
          ${config.bgColor} ${config.borderColor}
          ${className}
        `}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
              {config.icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${config.textColor}`}>
              {displayMessage}
            </h3>

            {details && (
              <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
                {details}
              </p>
            )}
          </div>

          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={`
                flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5
                ${config.iconColor} hover:opacity-75 transition-opacity
              `}
              aria-label="Dismiss message"
            >
              <svg
                className="w-5 h-5"
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
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        flex items-start space-x-3 p-4 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        ${className}
      `}
    >
      {showIcon && (
        <div className={`flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {displayMessage}
        </p>

        {details && (
          <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
            {details}
          </p>
        )}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5
            ${config.iconColor} hover:opacity-75 transition-opacity
          `}
          aria-label="Dismiss message"
        >
          <svg
            className="w-5 h-5"
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
    </motion.div>
  );
}

// Toast-style status message for notifications
export interface StatusToastProps {
  phase: UploadPhase;
  message?: string;
  fileName?: string;
  autoHide?: boolean;
  duration?: number;
  onHide?: () => void;
  className?: string;
}

export function StatusToast({
  phase,
  message,
  fileName,
  autoHide = true,
  duration = 5000,
  onHide,
  className = '',
}: StatusToastProps) {
  const config = phaseConfig[phase];
  const displayMessage = message || config.defaultMessage;

  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && onHide) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, duration, onHide]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`
        flex items-start space-x-3 p-4 rounded-lg shadow-lg border
        bg-white dark:bg-gray-800 ${config.borderColor}
        max-w-sm w-full
        ${className}
      `}
    >
      <div className={`flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>
          {displayMessage}
        </p>

        {fileName && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
            {fileName}
          </p>
        )}
      </div>

      {onHide && (
        <button
          onClick={onHide}
          className="
            flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            transition-colors
          "
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
      )}
    </motion.div>
  );
}

// Status message list for multiple messages
export interface StatusMessageListProps {
  messages: Array<{
    id: string;
    phase: UploadPhase;
    message?: string;
    details?: string;
    dismissible?: boolean;
  }>;
  onDismiss?: (_id: string) => void;
  className?: string;
}

export function StatusMessageList({
  messages,
  onDismiss,
  className = '',
}: StatusMessageListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence>
        {messages.map(({ id, phase, message, details, dismissible }) => (
          <StatusMessage
            key={id}
            phase={phase}
            message={message}
            details={details}
            variant="compact"
            dismissible={dismissible}
            onDismiss={
              dismissible && onDismiss ? () => onDismiss(id) : undefined
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
