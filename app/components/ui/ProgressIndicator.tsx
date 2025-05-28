'use client';

/**
 * Production Progress Indicator Component
 * Real-time progress visualization for Qwen2.5-VL processing operations
 */

import React from 'react';
import {
  Clock,
  Upload,
  Settings,
  Brain,
  FileText,
  CheckCircle,
  CheckCircle2,
  XCircle,
  StopCircle,
  AlertTriangle,
} from 'lucide-react';
import type {
  ProcessingStage,
  ProcessingProgress,
} from '@/lib/types/progress-types';

const STAGE_ICONS = {
  idle: Clock,
  uploading: Upload,
  preprocessing: Settings,
  'ai-analysis': Brain,
  'data-extraction': FileText,
  validation: CheckCircle,
  completed: CheckCircle2,
  error: XCircle,
  cancelled: StopCircle,
};

const STAGE_COLORS = {
  idle: 'text-gray-500 bg-gray-100',
  uploading: 'text-blue-600 bg-blue-100',
  preprocessing: 'text-yellow-600 bg-yellow-100',
  'ai-analysis': 'text-purple-600 bg-purple-100',
  'data-extraction': 'text-indigo-600 bg-indigo-100',
  validation: 'text-green-600 bg-green-100',
  completed: 'text-green-700 bg-green-200',
  error: 'text-red-600 bg-red-100',
  cancelled: 'text-orange-600 bg-orange-100',
};

const STAGE_NAMES = {
  idle: 'Ready',
  uploading: 'Uploading',
  preprocessing: 'Preprocessing',
  'ai-analysis': 'AI Analysis',
  'data-extraction': 'Data Extraction',
  validation: 'Validation',
  completed: 'Completed',
  error: 'Error',
  cancelled: 'Cancelled',
};

export interface ProgressIndicatorProps {
  /** Current processing progress */
  progress: ProcessingProgress;
  /** Whether to show detailed timing information */
  showTiming?: boolean;
  /** Whether to show stage details */
  showStages?: boolean;
  /** Whether to show cancellation button */
  showCancel?: boolean;
  /** Cancellation callback */
  onCancel?: () => void;
  /** Custom className */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * Format time duration for display
 */
function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) return '< 1s';

  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Production Progress Indicator Component
 */
export default function ProgressIndicator({
  progress,
  showTiming = true,
  showStages = true,
  showCancel = true,
  onCancel,
  className = '',
  compact = false,
}: ProgressIndicatorProps) {
  const StageIcon = STAGE_ICONS[progress.currentStage] || Clock;
  const stageColors =
    STAGE_COLORS[progress.currentStage] || 'text-gray-500 bg-gray-100';
  const stageName = STAGE_NAMES[progress.currentStage] || 'Unknown';

  const isError = progress.currentStage === 'error';
  const isCancelled = progress.currentStage === 'cancelled';
  const isCompleted = progress.currentStage === 'completed';
  const isActive = !isError && !isCancelled && !isCompleted;

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`p-2 rounded-full ${stageColors}`}>
          <StageIcon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{stageName}</span>
            <span>{progress.overallProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>
        {showCancel && isActive && progress.cancellable && onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Cancel processing"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${stageColors}`}>
            <StageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{stageName}</h3>
            <p className="text-sm text-gray-600">
              {isError && 'Processing failed'}
              {isCancelled && 'Processing cancelled'}
              {isCompleted && 'Processing completed successfully'}
              {isActive && 'Processing in progress...'}
            </p>
          </div>
        </div>

        {showCancel && isActive && progress.cancellable && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progress.overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                isError
                  ? 'bg-red-500'
                  : isCancelled
                    ? 'bg-orange-500'
                    : isCompleted
                      ? 'bg-green-500'
                      : 'bg-blue-600'
              }`}
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stage Progress */}
        {isActive && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Current Stage</span>
              <span>{progress.stageProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.stageProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timing Information */}
      {showTiming && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-sm text-gray-500">Elapsed</div>
            <div className="font-semibold text-gray-900">
              {formatDuration(progress.elapsedTime)}
            </div>
          </div>
          {isActive && (
            <div className="text-center">
              <div className="text-sm text-gray-500">Remaining</div>
              <div className="font-semibold text-gray-900">
                {formatDuration(progress.remainingTime)}
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="text-sm text-gray-500">Speed</div>
            <div className="font-semibold text-gray-900">
              {progress.processingSpeed > 0
                ? `${progress.processingSpeed.toFixed(1)}/s`
                : '--'}
            </div>
          </div>
        </div>
      )}

      {/* Stage Indicators */}
      {showStages && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Processing Stages
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {(
              [
                'uploading',
                'preprocessing',
                'ai-analysis',
                'data-extraction',
                'validation',
                'completed',
              ] as ProcessingStage[]
            ).map(stage => {
              const Icon = STAGE_ICONS[stage];
              const isCurrentStage = progress.currentStage === stage;
              const isCompletedStage =
                ['completed'].includes(progress.currentStage) ||
                [
                  'uploading',
                  'preprocessing',
                  'ai-analysis',
                  'data-extraction',
                  'validation',
                ].indexOf(progress.currentStage) >
                  [
                    'uploading',
                    'preprocessing',
                    'ai-analysis',
                    'data-extraction',
                    'validation',
                  ].indexOf(stage);

              return (
                <div
                  key={stage}
                  className={`p-2 rounded-lg text-center transition-all ${
                    isCurrentStage
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : isCompletedStage
                        ? 'bg-green-100 border-2 border-green-500'
                        : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mx-auto mb-1 ${
                      isCurrentStage
                        ? 'text-blue-600'
                        : isCompletedStage
                          ? 'text-green-600'
                          : 'text-gray-400'
                    }`}
                  />
                  <div className="text-xs font-medium capitalize">
                    {stage.replace('-', ' ')}
                  </div>
                  {isCurrentStage && (
                    <div className="text-xs text-blue-600 mt-1">
                      {progress.stageProgress.toFixed(0)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error/Warning States */}
      {(isError || isCancelled) && (
        <div
          className={`mt-4 p-3 rounded-md ${
            isError
              ? 'bg-red-50 border border-red-200'
              : 'bg-orange-50 border border-orange-200'
          }`}
        >
          <div className="flex items-center">
            {isError ? (
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            )}
            <span
              className={`text-sm font-medium ${
                isError ? 'text-red-800' : 'text-orange-800'
              }`}
            >
              {isError ? 'Processing failed' : 'Processing was cancelled'}
            </span>
          </div>
        </div>
      )}

      {/* Success State */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Processing completed successfully in{' '}
              {formatDuration(progress.elapsedTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
