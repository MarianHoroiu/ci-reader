'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface InstallButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isInstalling?: boolean;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

const InstallButton = forwardRef<HTMLButtonElement, InstallButtonProps>(
  (
    {
      isInstalling = false,
      variant = 'primary',
      size = 'md',
      showIcon = true,
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
        'bg-blue-600',
        'text-white',
        'hover:bg-blue-700',
        'focus:ring-blue-500',
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
        'text-blue-600',
        'hover:bg-blue-50',
        'focus:ring-blue-500',
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

    const defaultChildren = children || 'Install App';

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isInstalling}
        aria-label={isInstalling ? 'Installing app...' : 'Install app'}
        {...props}
      >
        {isInstalling ? (
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
            <span>Installing...</span>
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

InstallButton.displayName = 'InstallButton';

export default InstallButton;
