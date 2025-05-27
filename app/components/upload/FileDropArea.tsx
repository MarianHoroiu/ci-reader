'use client';

import { forwardRef } from 'react';
import type { DragState } from '@/hooks/useFileUpload';

export interface FileDropAreaProps {
  dragState: DragState;
  isDragActive: boolean;
  onDragEnter: (_event: React.DragEvent) => void;
  onDragLeave: (_event: React.DragEvent) => void;
  onDragOver: (_event: React.DragEvent) => void;
  onDrop: (_event: React.DragEvent) => void;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FileDropArea = forwardRef<HTMLDivElement, FileDropAreaProps>(
  (
    {
      dragState,
      isDragActive,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      onClick,
      disabled = false,
      className = '',
      children,
    },
    ref
  ) => {
    const baseClasses = [
      'relative',
      'border-2',
      'border-dashed',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'focus:ring-primary-500',
    ];

    const stateClasses = {
      idle: [
        'border-gray-300',
        'bg-gray-50',
        'hover:border-primary-400',
        'hover:bg-primary-50',
      ],
      dragover: [
        'border-primary-500',
        'bg-primary-50',
        'ring-2',
        'ring-primary-200',
        'scale-[1.02]',
      ],
      invalid: ['border-red-400', 'bg-red-50', 'ring-2', 'ring-red-200'],
    };

    const disabledClasses = [
      'opacity-50',
      'cursor-not-allowed',
      'pointer-events-none',
    ];

    const classes = [
      ...baseClasses,
      ...stateClasses[dragState],
      ...(disabled ? disabledClasses : []),
      className,
    ].join(' ');

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        onClick &&
        !disabled
      ) {
        event.preventDefault();
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        className={classes}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File drop area. Drag and drop files here or click to browse."
        aria-disabled={disabled}
        data-drag-state={dragState}
        data-drag-active={isDragActive}
      >
        {/* Visual feedback overlay */}
        {isDragActive && (
          <div className="absolute inset-0 bg-primary-100 bg-opacity-50 rounded-lg pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Screen reader feedback */}
        <div className="sr-only" aria-live="polite">
          {dragState === 'dragover' && 'Files ready to drop'}
          {dragState === 'invalid' && 'Invalid file type'}
        </div>
      </div>
    );
  }
);

FileDropArea.displayName = 'FileDropArea';

export default FileDropArea;
