'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface UploadButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isUploading?: boolean;
  children?: React.ReactNode;
}

const UploadButton = forwardRef<HTMLButtonElement, UploadButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      showIcon = true,
      isUploading = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
    ];

    const variantClasses = {
      primary: [
        'bg-primary-600',
        'text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'shadow-sm',
        'hover:shadow-md',
      ],
      secondary: [
        'bg-gray-100',
        'text-gray-900',
        'hover:bg-gray-200',
        'focus:ring-gray-500',
        'border',
        'border-gray-300',
      ],
      minimal: [
        'bg-transparent',
        'text-primary-600',
        'hover:bg-primary-50',
        'focus:ring-primary-500',
      ],
    };

    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-sm', 'gap-1.5'],
      md: ['px-4', 'py-2', 'text-sm', 'gap-2'],
      lg: ['px-6', 'py-3', 'text-base', 'gap-2.5'],
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const classes = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      className,
    ].join(' ');

    const defaultChildren = children || 'Upload Files';

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isUploading}
        aria-label={isUploading ? 'Uploading files...' : 'Upload files'}
        {...props}
      >
        {isUploading ? (
          <>
            <svg
              className={`animate-spin ${iconSizeClasses[size]}`}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            {showIcon && (
              <svg
                className={iconSizeClasses[size]}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
            <span>{defaultChildren}</span>
          </>
        )}
      </button>
    );
  }
);

UploadButton.displayName = 'UploadButton';

export default UploadButton;
