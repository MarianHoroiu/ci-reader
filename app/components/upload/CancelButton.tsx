'use client';

import { motion } from 'framer-motion';

export interface CancelButtonProps {
  onCancel: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  confirmRequired?: boolean;
  confirmMessage?: string;
  className?: string;
}

export default function CancelButton({
  onCancel,
  disabled = false,
  variant = 'default',
  size = 'md',
  confirmRequired = false,
  confirmMessage = 'Are you sure you want to cancel this upload?',
  className = '',
}: CancelButtonProps) {
  const handleClick = () => {
    if (confirmRequired) {
      if (window.confirm(confirmMessage)) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      iconOnly: 'p-1',
    },
    md: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      iconOnly: 'p-1.5',
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      iconOnly: 'p-2',
    },
  };

  const sizes = sizeClasses[size];

  if (variant === 'icon-only') {
    return (
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizes.iconOnly} rounded-md transition-colors duration-200
          ${
            disabled
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }
          ${className}
        `}
        aria-label="Cancel upload"
        title="Cancel upload"
      >
        <svg
          className={sizes.icon}
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
      </motion.button>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={handleClick}
        disabled={disabled}
        className={`
          inline-flex items-center space-x-1 ${sizes.button} rounded-md
          border transition-colors duration-200
          ${
            disabled
              ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }
          ${className}
        `}
        aria-label="Cancel upload"
      >
        <svg
          className={sizes.icon}
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
        <span>Cancel</span>
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center space-x-2 ${sizes.button}
        rounded-md border font-medium transition-colors duration-200
        ${
          disabled
            ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
            : 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
        }
        ${className}
      `}
      aria-label="Cancel upload"
    >
      <svg
        className={sizes.icon}
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
      <span>Cancel Upload</span>
    </motion.button>
  );
}

// Cancel all button for multiple uploads
export interface CancelAllButtonProps {
  onCancelAll: () => void;
  activeCount: number;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  confirmRequired?: boolean;
  className?: string;
}

export function CancelAllButton({
  onCancelAll,
  activeCount,
  disabled = false,
  variant = 'default',
  size = 'md',
  confirmRequired = true,
  className = '',
}: CancelAllButtonProps) {
  const handleClick = () => {
    const message = `Are you sure you want to cancel all ${activeCount} active uploads?`;

    if (confirmRequired) {
      if (window.confirm(message)) {
        onCancelAll();
      }
    } else {
      onCancelAll();
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    default: disabled
      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
    danger: disabled
      ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
      : 'border-red-500 dark:border-red-600 text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={disabled || activeCount === 0}
      className={`
        inline-flex items-center justify-center space-x-2 ${sizeClasses[size]}
        rounded-md border font-medium transition-colors duration-200
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={`Cancel all ${activeCount} uploads`}
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
      <span>Cancel All ({activeCount})</span>
    </motion.button>
  );
}

// Floating cancel button for overlay scenarios
export interface FloatingCancelButtonProps {
  onCancel: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  disabled?: boolean;
  className?: string;
}

export function FloatingCancelButton({
  onCancel,
  position = 'top-right',
  disabled = false,
  className = '',
}: FloatingCancelButtonProps) {
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      onClick={onCancel}
      disabled={disabled}
      className={`
        absolute ${positionClasses[position]} z-10
        p-2 rounded-full shadow-lg transition-colors duration-200
        ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-700'
        }
        ${className}
      `}
      aria-label="Cancel upload"
      title="Cancel upload"
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
    </motion.button>
  );
}
