'use client';

import { useState, useCallback, useRef } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import { useUploadProgress } from './useUploadProgress';
import { validateFile } from '@/lib/utils/file-upload';
import type { UploadedFile } from './useFileUpload';

export interface UseFileUploadWithProgressOptions {
  onUploadComplete?: (_file: File, _response: any) => void;
  onUploadError?: (_file: File, _error: string) => void;
  uploadEndpoint?: string;
}

export interface UseFileUploadWithProgressReturn {
  // File state
  selectedFile: File | null;
  uploadedFile: UploadedFile | null;

  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  uploadSpeed: number;
  timeRemaining: number;
  currentPhase: string;

  // Actions
  selectFile: (_file: File) => void;
  startUpload: () => Promise<void>;
  cancelUpload: () => void;
  removeFile: () => void;

  // Progress hook integration
  progressHook: ReturnType<typeof useUploadProgress>;
}

export function useFileUploadWithProgress(
  options: UseFileUploadWithProgressOptions = {}
): UseFileUploadWithProgressReturn {
  const {
    onUploadComplete,
    onUploadError,
    uploadEndpoint = '/api/upload',
  } = options;

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFileIdRef = useRef<string | null>(null);

  // Progress hook
  const progressHook = useUploadProgress({
    onProgress: (fileId, progress) => {
      console.log(`Upload progress for ${fileId}:`, progress);
    },
    onPhaseChange: (fileId, phase) => {
      console.log(`Phase changed for ${fileId}:`, phase);
    },
    onComplete: fileId => {
      console.log(`Upload completed for ${fileId}`);
      setIsUploading(false);

      if (selectedFile) {
        const newUploadedFile: UploadedFile = {
          id: fileId,
          file: selectedFile,
          status: 'success',
        };
        setUploadedFile(newUploadedFile);
      }
    },
    onError: (fileId, error) => {
      console.log(`Upload failed for ${fileId}:`, error);
      setIsUploading(false);

      if (selectedFile) {
        const newUploadedFile: UploadedFile = {
          id: fileId,
          file: selectedFile,
          status: 'error',
          error,
        };
        setUploadedFile(newUploadedFile);
        onUploadError?.(selectedFile, error);
      }
    },
    onCancel: fileId => {
      console.log(`Upload cancelled for ${fileId}`);
      setIsUploading(false);

      if (selectedFile) {
        const newUploadedFile: UploadedFile = {
          id: fileId,
          file: selectedFile,
          status: 'error',
          error: 'Upload cancelled',
        };
        setUploadedFile(newUploadedFile);
      }
    },
  });

  // Get current progress data
  const currentProgress = currentFileIdRef.current
    ? progressHook.getProgress(currentFileIdRef.current)
    : null;

  const uploadProgress = currentProgress?.percentage || 0;
  const uploadSpeed = currentProgress?.speed || 0;
  const timeRemaining = currentProgress?.estimatedTimeRemaining || 0;
  const currentPhase = currentProgress?.phase || 'idle';

  // Select file
  const selectFile = useCallback(
    (file: File) => {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        onUploadError?.(file, validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);
      setUploadedFile(null);

      // Clear any existing progress
      if (currentFileIdRef.current) {
        progressHook.clearProgress(currentFileIdRef.current);
      }
    },
    [onUploadError, progressHook]
  );

  // Start upload
  const startUpload = useCallback(async () => {
    if (!selectedFile || isUploading) return;

    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentFileIdRef.current = fileId;

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsUploading(true);

      // Start progress tracking
      progressHook.startUpload(fileId, selectedFile);

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload with progress tracking
      const response = await axios.post(uploadEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortControllerRef.current.signal,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const bytesLoaded = progressEvent.loaded;
            progressHook.updateFileProgress(fileId, bytesLoaded);
          }
        },
      });

      // Simulate validation phase
      progressHook.setPhase(fileId, 'validating');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate compression phase (for images)
      if (selectedFile.type.startsWith('image/')) {
        progressHook.setPhase(fileId, 'compressing');
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Complete upload
      progressHook.completeUpload(fileId);
      onUploadComplete?.(selectedFile, response.data);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        progressHook.cancelUpload(fileId);
      } else {
        const errorMessage =
          error.response?.data?.error || error.message || 'Upload failed';
        progressHook.failUpload(fileId, errorMessage);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    selectedFile,
    isUploading,
    uploadEndpoint,
    progressHook,
    onUploadComplete,
  ]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (currentFileIdRef.current) {
      progressHook.cancelUpload(currentFileIdRef.current);
    }
  }, [progressHook]);

  // Remove file
  const removeFile = useCallback(() => {
    // Cancel any ongoing upload
    if (isUploading) {
      cancelUpload();
    }

    setSelectedFile(null);
    setUploadedFile(null);

    if (currentFileIdRef.current) {
      progressHook.clearProgress(currentFileIdRef.current);
      currentFileIdRef.current = null;
    }
  }, [isUploading, cancelUpload, progressHook]);

  return {
    // File state
    selectedFile,
    uploadedFile,

    // Upload state
    isUploading,
    uploadProgress,
    uploadSpeed,
    timeRemaining,
    currentPhase,

    // Actions
    selectFile,
    startUpload,
    cancelUpload,
    removeFile,

    // Progress hook integration
    progressHook,
  };
}
