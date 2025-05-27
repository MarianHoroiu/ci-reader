'use client';

import { motion } from 'framer-motion';
import { UploadPhase } from '@/lib/utils/progress-calculator';

export interface ProgressBarProps {
  percentage: number;
  phase: UploadPhase;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

const phaseColors = {
  uploading: {
    bg: 'bg-blue-200 dark:bg-blue-800',
    fill: 'bg-blue-600 dark:bg-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  validating: {
    bg: 'bg-yellow-200 dark:bg-yellow-800',
    fill: 'bg-yellow-500 dark:bg-yellow-400',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  compressing: {
    bg: 'bg-purple-200 dark:bg-purple-800',
    fill: 'bg-purple-600 dark:bg-purple-400',
    text: 'text-purple-600 dark:text-purple-400',
  },
  complete: {
    bg: 'bg-green-200 dark:bg-green-800',
    fill: 'bg-green-600 dark:bg-green-400',
    text: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-200 dark:bg-red-800',
    fill: 'bg-red-600 dark:bg-red-400',
    text: 'text-red-600 dark:text-red-400',
  },
  cancelled: {
    bg: 'bg-gray-200 dark:bg-gray-700',
    fill: 'bg-gray-500 dark:bg-gray-400',
    text: 'text-gray-600 dark:text-gray-400',
  },
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function ProgressBar({
  percentage,
  phase,
  size = 'md',
  showPercentage = true,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const colors = phaseColors[phase];
  const heightClass = sizeClasses[size];

  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div
        className={`
          w-full ${heightClass} rounded-full overflow-hidden
          ${colors.bg}
          transition-colors duration-300
        `}
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${clampedPercentage}% ${phase}`}
      >
        {/* Progress fill */}
        {animated ? (
          <motion.div
            className={`h-full ${colors.fill} transition-colors duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedPercentage}%` }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
          />
        ) : (
          <div
            className={`h-full ${colors.fill} transition-all duration-500 ease-out`}
            style={{ width: `${clampedPercentage}%` }}
          />
        )}
      </div>

      {/* Percentage text */}
      {showPercentage && (
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs font-medium ${colors.text}`}>
            {clampedPercentage}%
          </span>

          {/* Phase indicator */}
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {phase === 'uploading' && 'Uploading...'}
            {phase === 'validating' && 'Validating...'}
            {phase === 'compressing' && 'Compressing...'}
            {phase === 'complete' && 'Complete'}
            {phase === 'error' && 'Error'}
            {phase === 'cancelled' && 'Cancelled'}
          </span>
        </div>
      )}
    </div>
  );
}

// Circular progress variant
export interface CircularProgressProps {
  percentage: number;
  phase: UploadPhase;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  percentage,
  phase,
  size = 64,
  strokeWidth = 4,
  showPercentage = true,
  className = '',
}: CircularProgressProps) {
  const colors = phaseColors[phase];
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={clampedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${clampedPercentage}% ${phase}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colors.text}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
          style={{
            strokeDasharray,
          }}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-semibold ${colors.text}`}>
            {clampedPercentage}%
          </span>
        </div>
      )}
    </div>
  );
}

// Mini progress indicator for compact spaces
export interface MiniProgressProps {
  percentage: number;
  phase: UploadPhase;
  className?: string;
}

export function MiniProgress({
  percentage,
  phase,
  className = '',
}: MiniProgressProps) {
  const colors = phaseColors[phase];
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Mini progress bar */}
      <div className={`flex-1 h-1 rounded-full ${colors.bg}`}>
        <motion.div
          className={`h-full rounded-full ${colors.fill}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      </div>

      {/* Percentage */}
      <span
        className={`text-xs font-medium ${colors.text} min-w-[3rem] text-right`}
      >
        {clampedPercentage}%
      </span>
    </div>
  );
}
