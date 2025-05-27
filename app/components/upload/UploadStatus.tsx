'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ProgressState,
  formatBytes,
  formatSpeed,
  formatTimeRemaining,
} from '@/lib/utils/progress-calculator';
import ProgressBar, { CircularProgress } from './ProgressBar';

export interface UploadStatusProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  progress: ProgressState;
  variant?: 'default' | 'compact' | 'detailed';
  showCancel?: boolean;
  onCancel?: ((_fileId: string) => void) | undefined;
  className?: string;
}

const phaseIcons = {
  uploading: (
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
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  ),
  validating: (
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
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  compressing: (
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
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
      />
    </svg>
  ),
  complete: (
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
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
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
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  cancelled: (
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
  ),
};

const phaseMessages = {
  uploading: 'Uploading file...',
  validating: 'Validating file format and content...',
  compressing: 'Optimizing file size...',
  complete: 'Upload completed successfully',
  error: 'Upload failed',
  cancelled: 'Upload cancelled',
};

const phaseColors = {
  uploading: 'text-blue-600 dark:text-blue-400',
  validating: 'text-yellow-600 dark:text-yellow-400',
  compressing: 'text-purple-600 dark:text-purple-400',
  complete: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  cancelled: 'text-gray-600 dark:text-gray-400',
};

export default function UploadStatus({
  fileId,
  fileName,
  fileSize,
  progress,
  variant = 'default',
  showCancel = true,
  onCancel,
  className = '',
}: UploadStatusProps) {
  const { phase, percentage, bytesLoaded, speed, estimatedTimeRemaining } =
    progress;

  const handleCancel = () => {
    onCancel?.(fileId);
  };

  const isActive =
    phase === 'uploading' || phase === 'validating' || phase === 'compressing';
  const canCancel = isActive && showCancel && onCancel;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 
          rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm
          ${className}
        `}
      >
        {/* Phase icon */}
        <div className={`flex-shrink-0 ${phaseColors[phase]}`}>
          {phaseIcons[phase]}
        </div>

        {/* File info and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fileName}
            </p>
            {canCancel && (
              <button
                onClick={handleCancel}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Cancel upload"
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

          <ProgressBar
            percentage={percentage}
            phase={phase}
            size="sm"
            showPercentage={false}
          />

          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(bytesLoaded)} / {formatBytes(fileSize)}
            </span>
            <span className={`text-xs ${phaseColors[phase]}`}>
              {percentage}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`
          p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
          dark:border-gray-700 shadow-lg ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${phaseColors[phase]}`}>{phaseIcons[phase]}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {fileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatBytes(fileSize)}
              </p>
            </div>
          </div>

          {canCancel && (
            <button
              onClick={handleCancel}
              className="
                px-3 py-1 text-sm text-gray-600 dark:text-gray-400 
                hover:text-red-600 dark:hover:text-red-400
                border border-gray-300 dark:border-gray-600 
                rounded-md hover:border-red-300 dark:hover:border-red-600
                transition-colors duration-200
              "
            >
              Cancel
            </button>
          )}
        </div>

        {/* Progress section */}
        <div className="space-y-4">
          {/* Circular progress */}
          <div className="flex items-center justify-center">
            <CircularProgress
              percentage={percentage}
              phase={phase}
              size={80}
              strokeWidth={6}
            />
          </div>

          {/* Status message */}
          <div className="text-center">
            <p className={`text-sm font-medium ${phaseColors[phase]}`}>
              {phaseMessages[phase]}
            </p>
          </div>

          {/* Detailed stats */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Speed
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {speed ? formatSpeed(speed) : '--'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Time remaining
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {estimatedTimeRemaining
                    ? formatTimeRemaining(estimatedTimeRemaining)
                    : '--'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
        dark:border-gray-700 shadow-sm ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`${phaseColors[phase]}`}>{phaseIcons[phase]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatBytes(fileSize)}
            </p>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={handleCancel}
            className="
              p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400
              rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-200
            "
            aria-label="Cancel upload"
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

      {/* Progress bar */}
      <ProgressBar
        percentage={percentage}
        phase={phase}
        size="md"
        showPercentage={true}
      />

      {/* Status info */}
      <div className="mt-2 flex justify-between items-center text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          {formatBytes(bytesLoaded)} / {formatBytes(fileSize)}
        </span>

        {isActive && speed && (
          <span className="text-gray-500 dark:text-gray-400">
            {formatSpeed(speed)}
            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <> • {formatTimeRemaining(estimatedTimeRemaining)} remaining</>
            )}
          </span>
        )}
      </div>

      {/* Status message */}
      <p className={`mt-1 text-xs ${phaseColors[phase]}`}>
        {phaseMessages[phase]}
      </p>
    </motion.div>
  );
}

// Multi-file upload status component
export interface MultiUploadStatusProps {
  files: Map<
    string,
    { fileName: string; fileSize: number; progress: ProgressState }
  >;
  overallProgress: number;
  onCancelFile?: (_fileId: string) => void;
  onCancelAll?: () => void;
  className?: string;
}

export function MultiUploadStatus({
  files,
  overallProgress,
  onCancelFile,
  onCancelAll,
  className = '',
}: MultiUploadStatusProps) {
  const fileArray = Array.from(files.entries());
  const hasActiveUploads = fileArray.some(
    ([, { progress }]) =>
      progress.phase === 'uploading' ||
      progress.phase === 'validating' ||
      progress.phase === 'compressing'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
    >
      {/* Overall progress */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Overall Progress ({fileArray.length} files)
          </h3>

          {hasActiveUploads && onCancelAll && (
            <button
              onClick={onCancelAll}
              className="
                px-3 py-1 text-xs text-red-600 dark:text-red-400
                border border-red-300 dark:border-red-600 rounded-md
                hover:bg-red-50 dark:hover:bg-red-900/20
                transition-colors duration-200
              "
            >
              Cancel All
            </button>
          )}
        </div>

        <ProgressBar
          percentage={overallProgress}
          phase={hasActiveUploads ? 'uploading' : 'complete'}
          size="lg"
          showPercentage={true}
        />
      </div>

      {/* Individual file statuses */}
      <div className="space-y-2">
        <AnimatePresence>
          {fileArray.map(([fileId, { fileName, fileSize, progress }]) => (
            <UploadStatus
              key={fileId}
              fileId={fileId}
              fileName={fileName}
              fileSize={fileSize}
              progress={progress}
              variant="compact"
              onCancel={onCancelFile}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
