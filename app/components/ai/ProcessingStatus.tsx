'use client';

/**
 * AI Processing Status Component
 * Shows real-time status of Qwen2.5-VL AI processing operations
 */

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import ProgressIndicator from '@/components/ui/ProgressIndicator';
import type { ProcessingProgress } from '@/lib/types/progress-types';
import type { AIVisionErrorCode } from '@/lib/types/romanian-id-types';
import { getAIErrorMessage } from '@/lib/utils/ai-integration-utils';

export interface ProcessingStatusProps {
  /** Whether AI processing is currently running */
  isProcessing: boolean;
  /** Current processing progress */
  progress?: ProcessingProgress;
  /** Processing error if any */
  error?: { code: AIVisionErrorCode; message: string } | null;
  /** Whether processing was cancelled */
  isCancelled?: boolean;
  /** Whether processing completed successfully */
  isCompleted?: boolean;
  /** File being processed */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Callback to cancel processing */
  onCancel?: () => void;
  /** Callback to retry processing */
  onRetry?: () => void;
  /** Callback to reset and start over */
  onReset?: () => void;
  /** Custom className */
  className?: string;
  /** Show compact version */
  compact?: boolean;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * AI Processing Status Component
 */
export default function ProcessingStatus({
  isProcessing,
  progress,
  error,
  isCancelled = false,
  isCompleted = false,
  fileName,
  fileSize,
  onCancel,
  onRetry,
  onReset,
  className = '',
  compact = false,
}: ProcessingStatusProps) {
  // Don't render if no processing activity
  if (!isProcessing && !error && !isCancelled && !isCompleted) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Procesarea a eșuat
            </h3>
            <p className="text-red-700 mb-4">{getAIErrorMessage(error.code)}</p>
            {fileName && (
              <p className="text-sm text-red-600 mb-4">
                Fișier: {fileName}
                {fileSize && ` (${formatFileSize(fileSize)})`}
              </p>
            )}
            <div className="flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Încearcă din nou
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Anulează
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cancelled state
  if (isCancelled) {
    return (
      <div
        className={`bg-orange-50 border border-orange-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start">
          <X className="w-6 h-6 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Procesarea a fost anulată
            </h3>
            <p className="text-orange-700 mb-4">
              Procesarea AI a fost întreruptă la cererea utilizatorului.
            </p>
            {fileName && (
              <p className="text-sm text-orange-600 mb-4">
                Fișier: {fileName}
                {fileSize && ` (${formatFileSize(fileSize)})`}
              </p>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Începe din nou
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start">
          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
            <svg
              className="w-4 h-4 text-white"
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
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Procesarea s-a finalizat cu succes
            </h3>
            <p className="text-green-700 mb-4">
              Datele au fost extrase din documentul Romanian ID și sunt gata
              pentru vizualizare.
            </p>
            {fileName && (
              <p className="text-sm text-green-600 mb-4">
                Fișier: {fileName}
                {fileSize && ` (${formatFileSize(fileSize)})`}
              </p>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Procesează alt fișier
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Processing state - use ProgressIndicator
  if (isProcessing && progress) {
    return (
      <div className={className}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Procesare AI în curs...
          </h3>
          {fileName && (
            <p className="text-sm text-gray-600">
              Fișier: {fileName}
              {fileSize && ` (${formatFileSize(fileSize)})`}
            </p>
          )}
        </div>

        <ProgressIndicator
          progress={progress}
          showTiming={!compact}
          showStages={!compact}
          showCancel={!!onCancel}
          {...(onCancel && { onCancel })}
          compact={compact}
        />
      </div>
    );
  }

  // Fallback for processing without progress
  if (isProcessing) {
    return (
      <div
        className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 mb-1">
              Procesare AI în curs...
            </h3>
            <p className="text-blue-700">
              Vă rugăm să așteptați în timp ce procesăm documentul.
            </p>
            {fileName && (
              <p className="text-sm text-blue-600 mt-2">
                Fișier: {fileName}
                {fileSize && ` (${formatFileSize(fileSize)})`}
              </p>
            )}
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
              title="Anulează procesarea"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
