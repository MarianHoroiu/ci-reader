'use client';

/**
 * React Hook for AI Processing Progress Tracking
 * Provides state management and callbacks for Qwen2.5-VL processing
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type {
  ProcessingStage,
  ProcessingProgress,
  ProcessingSession,
  ProcessingError,
  ProgressTrackerOptions,
} from '@/lib/types/progress-types';
import { QwenProgressTracker } from '@/lib/progress/qwen-progress-tracker';

export interface UseProcessingProgressOptions {
  /** Auto-start progress tracking when session is created */
  autoStart?: boolean;
  /** Enable progress persistence across page refreshes */
  persistProgress?: boolean;
  /** Progress update interval in milliseconds */
  updateInterval?: number;
  /** Enable performance metrics collection */
  collectMetrics?: boolean;
  /** Maximum retry attempts for recoverable errors */
  maxRetries?: number;
  /** Processing timeout in milliseconds */
  timeout?: number;
  /** Callback when processing completes successfully */
  onComplete?: (_session: ProcessingSession) => void;
  /** Callback when processing fails */
  onError?: (_error: ProcessingError) => void;
  /** Callback when processing is cancelled */
  onCancel?: (_sessionId: string) => void;
  /** Callback for progress updates */
  onProgress?: (_progress: ProcessingProgress) => void;
  /** Callback for stage changes */
  onStageChange?: (_stage: ProcessingStage, _progress: number) => void;
}

export interface UseProcessingProgressReturn {
  // State
  /** Current processing session */
  session: ProcessingSession | null;
  /** Current processing progress */
  progress: ProcessingProgress | null;
  /** Current processing stage */
  currentStage: ProcessingStage;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Current stage progress percentage (0-100) */
  stageProgress: number;
  /** Elapsed time in milliseconds */
  elapsedTime: number;
  /** Remaining time in milliseconds */
  remainingTime: number;
  /** Whether processing is currently active */
  isProcessing: boolean;
  /** Whether current stage can be cancelled */
  canCancel: boolean;
  /** Processing errors */
  errors: ProcessingError[];
  /** Whether processing has completed */
  isCompleted: boolean;
  /** Whether processing failed */
  isFailed: boolean;
  /** Whether processing was cancelled */
  isCancelled: boolean;

  // Actions
  /** Start a new processing session */
  startProcessing: (
    _sessionId: string,
    _imageMetadata: {
      size: number;
      width: number;
      height: number;
      format: string;
      complexity?: number;
    }
  ) => void;
  /** Update processing stage */
  updateStage: (_stage: ProcessingStage, _progress?: number) => void;
  /** Update stage progress */
  updateProgress: (_progress: number) => void;
  /** Cancel current processing */
  cancelProcessing: () => void;
  /** Reset processing state */
  reset: () => void;
  /** Handle processing error */
  reportError: (_error: Omit<ProcessingError, 'stage' | 'timestamp'>) => void;

  // Utilities
  /** Get formatted elapsed time */
  getFormattedElapsedTime: () => string;
  /** Get formatted remaining time */
  getFormattedRemainingTime: () => string;
  /** Get processing efficiency score */
  getEfficiency: () => number;
  /** Check if processing is delayed */
  isDelayed: () => boolean;
}

/**
 * Hook for managing AI processing progress
 */
export function useProcessingProgress(
  options: UseProcessingProgressOptions = {}
): UseProcessingProgressReturn {
  // State
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);

  // Refs
  const trackerRef = useRef<QwenProgressTracker | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Create stable callback references
  const stableCallbacks = useMemo(
    () => ({
      onProgress: options.onProgress,
      onStageChange: options.onStageChange,
      onError: options.onError,
      onComplete: options.onComplete,
      onCancel: options.onCancel,
    }),
    [
      options.onProgress,
      options.onStageChange,
      options.onError,
      options.onComplete,
      options.onCancel,
    ]
  );

  // Initialize tracker
  useEffect(() => {
    const trackerOptions: ProgressTrackerOptions = {};

    if (options.updateInterval !== undefined) {
      trackerOptions.updateInterval = options.updateInterval;
    }
    if (options.persistProgress !== undefined) {
      trackerOptions.persistProgress = options.persistProgress;
    }
    if (options.collectMetrics !== undefined) {
      trackerOptions.collectMetrics = options.collectMetrics;
    }
    if (options.maxRetries !== undefined) {
      trackerOptions.maxRetries = options.maxRetries;
    }
    if (options.timeout !== undefined) {
      trackerOptions.timeout = options.timeout;
    }

    trackerOptions.callbacks = {
      onProgress: progressUpdate => {
        setProgress(progressUpdate);
        stableCallbacks.onProgress?.(progressUpdate);
      },
      onStageChange: (stage, stageProgress) => {
        stableCallbacks.onStageChange?.(stage, stageProgress);
      },
      onError: error => {
        stableCallbacks.onError?.(error);
      },
      onComplete: completedSession => {
        setSession(completedSession);
        stableCallbacks.onComplete?.(completedSession);
      },
    };

    trackerRef.current = new QwenProgressTracker(trackerOptions);

    return () => {
      // Cleanup on unmount
      if (trackerRef.current && currentSessionIdRef.current) {
        trackerRef.current.cleanup(currentSessionIdRef.current);
      }
    };
  }, [
    options.updateInterval,
    options.persistProgress,
    options.collectMetrics,
    options.maxRetries,
    options.timeout,
    stableCallbacks,
  ]);

  // Start processing
  const startProcessing = useCallback(
    (
      sessionId: string,
      imageMetadata: {
        size: number;
        width: number;
        height: number;
        format: string;
        complexity?: number;
      }
    ) => {
      if (!trackerRef.current) return;

      currentSessionIdRef.current = sessionId;
      const newSession = trackerRef.current.startSession(
        sessionId,
        imageMetadata
      );
      setSession(newSession);
      setProgress(newSession.progress);

      if (options.autoStart) {
        // Auto-advance to uploading stage
        setTimeout(() => {
          trackerRef.current?.updateStage(sessionId, 'uploading', 0);
        }, 100);
      }
    },
    [options.autoStart]
  );

  // Update stage
  const updateStage = useCallback(
    (stage: ProcessingStage, stageProgress = 0) => {
      if (!trackerRef.current || !currentSessionIdRef.current) return;

      trackerRef.current.updateStage(
        currentSessionIdRef.current,
        stage,
        stageProgress
      );

      // Update local session state
      const updatedSession = trackerRef.current.getSession(
        currentSessionIdRef.current
      );
      if (updatedSession) {
        setSession(updatedSession);
      }
    },
    []
  );

  // Update progress
  const updateProgress = useCallback((progressValue: number) => {
    if (!trackerRef.current || !currentSessionIdRef.current) return;

    trackerRef.current.updateStageProgress(
      currentSessionIdRef.current,
      progressValue
    );

    // Update local session state
    const updatedSession = trackerRef.current.getSession(
      currentSessionIdRef.current
    );
    if (updatedSession) {
      setSession(updatedSession);
    }
  }, []);

  // Cancel processing
  const cancelProcessing = useCallback(() => {
    if (!trackerRef.current || !currentSessionIdRef.current) return;

    trackerRef.current.cancelSession(currentSessionIdRef.current);
    stableCallbacks.onCancel?.(currentSessionIdRef.current);
  }, [stableCallbacks]);

  // Reset state
  const reset = useCallback(() => {
    if (trackerRef.current && currentSessionIdRef.current) {
      trackerRef.current.cleanup(currentSessionIdRef.current);
    }

    setSession(null);
    setProgress(null);
    currentSessionIdRef.current = null;
  }, []);

  // Report error
  const reportError = useCallback(
    (error: Omit<ProcessingError, 'stage' | 'timestamp'>) => {
      if (!trackerRef.current || !currentSessionIdRef.current) return;

      trackerRef.current.handleError(currentSessionIdRef.current, {
        ...error,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Utility functions
  const getFormattedElapsedTime = useCallback(() => {
    if (!progress) return '0s';

    const seconds = Math.floor(progress.elapsedTime / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [progress]);

  const getFormattedRemainingTime = useCallback(() => {
    if (!progress) return '0s';

    const seconds = Math.floor(progress.remainingTime / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [progress]);

  const getEfficiency = useCallback(() => {
    if (!session?.metrics) return 0;
    return session.metrics.efficiency;
  }, [session]);

  const isDelayed = useCallback(() => {
    if (!session || !progress) return false;

    const tolerance = 1.5; // 50% tolerance
    return (
      progress.elapsedTime > session.timeEstimation.estimatedTime * tolerance
    );
  }, [session, progress]);

  // Derived state
  const currentStage = progress?.currentStage || 'idle';
  const overallProgress = progress?.overallProgress || 0;
  const stageProgress = progress?.stageProgress || 0;
  const elapsedTime = progress?.elapsedTime || 0;
  const remainingTime = progress?.remainingTime || 0;
  const isProcessing = session?.status === 'active';
  const canCancel = progress?.cancellable || false;
  const errors = session?.errors || [];
  const isCompleted = session?.status === 'completed';
  const isFailed = session?.status === 'failed';
  const isCancelled = session?.status === 'cancelled';

  return {
    // State
    session,
    progress,
    currentStage,
    overallProgress,
    stageProgress,
    elapsedTime,
    remainingTime,
    isProcessing,
    canCancel,
    errors,
    isCompleted,
    isFailed,
    isCancelled,

    // Actions
    startProcessing,
    updateStage,
    updateProgress,
    cancelProcessing,
    reset,
    reportError,

    // Utilities
    getFormattedElapsedTime,
    getFormattedRemainingTime,
    getEfficiency,
    isDelayed,
  };
}
