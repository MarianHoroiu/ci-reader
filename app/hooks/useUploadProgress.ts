'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ProgressState,
  MultiFileProgress,
  UploadPhase,
  createInitialProgress,
  updateProgress,
  createMultiFileProgress,
  updateMultiFileProgress,
  calculateWeightedProgress,
} from '@/lib/utils/progress-calculator';

export interface UploadProgressOptions {
  onProgress?: (_fileId: string, _progress: ProgressState) => void;
  onPhaseChange?: (_fileId: string, _phase: UploadPhase) => void;
  onComplete?: (_fileId: string) => void;
  onError?: (_fileId: string, _error: string) => void;
  onCancel?: (_fileId: string) => void;
}

export interface UseUploadProgressReturn {
  // State
  progress: Map<string, ProgressState>;
  multiFileProgress: MultiFileProgress;
  isUploading: boolean;

  // Actions
  startUpload: (_fileId: string, _file: File) => void;
  updateFileProgress: (_fileId: string, _bytesLoaded: number) => void;
  setPhase: (
    _fileId: string,
    _phase: UploadPhase,
    _phaseProgress?: number
  ) => void;
  cancelUpload: (_fileId: string) => void;
  cancelAllUploads: () => void;
  completeUpload: (_fileId: string) => void;
  failUpload: (_fileId: string, _error: string) => void;
  clearProgress: (_fileId?: string) => void;

  // Utilities
  getProgress: (_fileId: string) => ProgressState | undefined;
  isFileUploading: (_fileId: string) => boolean;
  getActiveUploads: () => string[];
}

export function useUploadProgress(
  options: UploadProgressOptions = {}
): UseUploadProgressReturn {
  const { onProgress, onPhaseChange, onComplete, onError, onCancel } = options;

  // State
  const [progress, setProgress] = useState<Map<string, ProgressState>>(
    new Map()
  );
  const [multiFileProgress, setMultiFileProgress] = useState<MultiFileProgress>(
    createMultiFileProgress()
  );

  // Refs for cleanup
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Derived state
  const isUploading = multiFileProgress.activeUploads > 0;

  // Update progress state and notify callbacks
  const updateProgressState = useCallback(
    (fileId: string, newProgress: ProgressState) => {
      setProgress(prev => {
        const updated = new Map(prev);
        updated.set(fileId, newProgress);
        return updated;
      });

      setMultiFileProgress(prev =>
        updateMultiFileProgress(prev, fileId, newProgress)
      );

      onProgress?.(fileId, newProgress);
    },
    [onProgress]
  );

  // Start upload for a file
  const startUpload = useCallback(
    (fileId: string, file: File) => {
      const initialProgress = createInitialProgress(file.size);

      // Create abort controller for cancellation
      const abortController = new AbortController();
      abortControllersRef.current.set(fileId, abortController);

      updateProgressState(fileId, initialProgress);
    },
    [updateProgressState]
  );

  // Update file progress with bytes loaded
  const updateFileProgress = useCallback(
    (fileId: string, bytesLoaded: number) => {
      setProgress(prev => {
        const currentProgress = prev.get(fileId);
        if (!currentProgress) return prev;

        const updatedProgress = updateProgress(currentProgress, bytesLoaded);
        const updated = new Map(prev);
        updated.set(fileId, updatedProgress);

        setMultiFileProgress(prevMulti =>
          updateMultiFileProgress(prevMulti, fileId, updatedProgress)
        );

        onProgress?.(fileId, updatedProgress);

        return updated;
      });
    },
    [onProgress]
  );

  // Set upload phase (uploading, validating, compressing, etc.)
  const setPhase = useCallback(
    (fileId: string, phase: UploadPhase, phaseProgress = 0) => {
      setProgress(prev => {
        const currentProgress = prev.get(fileId);
        if (!currentProgress) return prev;

        // Calculate weighted progress based on phase
        const weightedPercentage = calculateWeightedProgress(
          phase,
          phaseProgress
        );

        const updatedProgress: ProgressState = {
          ...currentProgress,
          phase,
          percentage: Math.min(weightedPercentage, 100),
        };

        const updated = new Map(prev);
        updated.set(fileId, updatedProgress);

        setMultiFileProgress(prevMulti =>
          updateMultiFileProgress(prevMulti, fileId, updatedProgress)
        );

        onPhaseChange?.(fileId, phase);
        onProgress?.(fileId, updatedProgress);

        return updated;
      });
    },
    [onPhaseChange, onProgress]
  );

  // Cancel upload for a specific file
  const cancelUpload = useCallback(
    (fileId: string) => {
      // Abort the request if controller exists
      const controller = abortControllersRef.current.get(fileId);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(fileId);
      }

      setProgress(prev => {
        const currentProgress = prev.get(fileId);
        if (!currentProgress) return prev;

        const cancelledProgress: ProgressState = {
          ...currentProgress,
          phase: 'cancelled',
        };

        const updated = new Map(prev);
        updated.set(fileId, cancelledProgress);

        setMultiFileProgress(prevMulti =>
          updateMultiFileProgress(prevMulti, fileId, cancelledProgress)
        );

        onCancel?.(fileId);

        return updated;
      });
    },
    [onCancel]
  );

  // Cancel all active uploads
  const cancelAllUploads = useCallback(() => {
    // Abort all active controllers
    abortControllersRef.current.forEach((controller, fileId) => {
      controller.abort();
      onCancel?.(fileId);
    });
    abortControllersRef.current.clear();

    setProgress(prev => {
      const updated = new Map();
      prev.forEach((progressState, fileId) => {
        if (
          progressState.phase !== 'complete' &&
          progressState.phase !== 'error'
        ) {
          updated.set(fileId, {
            ...progressState,
            phase: 'cancelled' as UploadPhase,
          });
        } else {
          updated.set(fileId, progressState);
        }
      });

      // Update multi-file progress
      setMultiFileProgress(prevMulti => {
        let newMulti = prevMulti;
        updated.forEach((progressState, fileId) => {
          newMulti = updateMultiFileProgress(newMulti, fileId, progressState);
        });
        return newMulti;
      });

      return updated;
    });
  }, [onCancel]);

  // Complete upload for a file
  const completeUpload = useCallback(
    (fileId: string) => {
      // Clean up abort controller
      abortControllersRef.current.delete(fileId);

      setProgress(prev => {
        const currentProgress = prev.get(fileId);
        if (!currentProgress) return prev;

        const completedProgress: ProgressState = {
          ...currentProgress,
          phase: 'complete',
          percentage: 100,
          bytesLoaded: currentProgress.bytesTotal,
          estimatedTimeRemaining: 0,
        };

        const updated = new Map(prev);
        updated.set(fileId, completedProgress);

        setMultiFileProgress(prevMulti =>
          updateMultiFileProgress(prevMulti, fileId, completedProgress)
        );

        onComplete?.(fileId);

        return updated;
      });
    },
    [onComplete]
  );

  // Fail upload for a file
  const failUpload = useCallback(
    (fileId: string, error: string) => {
      // Clean up abort controller
      abortControllersRef.current.delete(fileId);

      setProgress(prev => {
        const currentProgress = prev.get(fileId);
        if (!currentProgress) return prev;

        const failedProgress: ProgressState = {
          ...currentProgress,
          phase: 'error',
        };

        const updated = new Map(prev);
        updated.set(fileId, failedProgress);

        setMultiFileProgress(prevMulti =>
          updateMultiFileProgress(prevMulti, fileId, failedProgress)
        );

        onError?.(fileId, error);

        return updated;
      });
    },
    [onError]
  );

  // Clear progress for a specific file or all files
  const clearProgress = useCallback((fileId?: string) => {
    if (fileId) {
      // Clear specific file
      abortControllersRef.current.delete(fileId);

      setProgress(prev => {
        const updated = new Map(prev);
        updated.delete(fileId);
        return updated;
      });

      setMultiFileProgress(prev => {
        const newFiles = new Map(prev.files);
        newFiles.delete(fileId);
        return {
          ...prev,
          files: newFiles,
          overallProgress: newFiles.size === 0 ? 0 : prev.overallProgress,
          activeUploads: Math.max(0, prev.activeUploads - 1),
        };
      });
    } else {
      // Clear all
      abortControllersRef.current.clear();
      setProgress(new Map());
      setMultiFileProgress(createMultiFileProgress());
    }
  }, []);

  // Utility functions
  const getProgress = useCallback(
    (fileId: string): ProgressState | undefined => {
      return progress.get(fileId);
    },
    [progress]
  );

  const isFileUploading = useCallback(
    (fileId: string): boolean => {
      const fileProgress = progress.get(fileId);
      return (
        fileProgress?.phase === 'uploading' ||
        fileProgress?.phase === 'validating' ||
        fileProgress?.phase === 'compressing' ||
        false
      );
    },
    [progress]
  );

  const getActiveUploads = useCallback((): string[] => {
    const active: string[] = [];
    progress.forEach((progressState, fileId) => {
      if (
        progressState.phase === 'uploading' ||
        progressState.phase === 'validating' ||
        progressState.phase === 'compressing'
      ) {
        active.push(fileId);
      }
    });
    return active;
  }, [progress]);

  return {
    // State
    progress,
    multiFileProgress,
    isUploading,

    // Actions
    startUpload,
    updateFileProgress,
    setPhase,
    cancelUpload,
    cancelAllUploads,
    completeUpload,
    failUpload,
    clearProgress,

    // Utilities
    getProgress,
    isFileUploading,
    getActiveUploads,
  };
}
