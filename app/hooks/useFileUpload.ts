'use client';

import { useCallback, useRef, useState } from 'react';
import {
  validateFiles,
  getFilesFromDragEvent,
  hasFiles,
  fileListToArray,
} from '@/lib/utils/file-upload';

export type DragState = 'idle' | 'dragover' | 'invalid';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UseFileUploadOptions {
  onFilesSelected?: (_files: File[]) => void;
  onFilesRejected?: (
    _rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => void;
  onDragStateChange?: (_state: DragState) => void;
}

export interface UseFileUploadReturn {
  // State
  dragState: DragState;
  isDragActive: boolean;
  uploadedFile: UploadedFile | null;

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  dropZoneRef: React.RefObject<HTMLDivElement | null>;

  // Handlers
  onDragEnter: (_event: React.DragEvent) => void;
  onDragLeave: (_event: React.DragEvent) => void;
  onDragOver: (_event: React.DragEvent) => void;
  onDrop: (_event: React.DragEvent) => void;
  onFileInputChange: (_event: React.ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
  removeFile: () => void;
  clearFile: () => void;

  // Utilities
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): UseFileUploadReturn {
  const { onFilesSelected, onFilesRejected, onDragStateChange } = options;

  // State - single file only
  const [dragState, setDragState] = useState<DragState>('idle');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);

  // Derived state
  const isDragActive = dragState === 'dragover';

  // Update drag state and notify parent
  const updateDragState = useCallback(
    (newState: DragState) => {
      setDragState(newState);
      onDragStateChange?.(newState);
    },
    [onDragStateChange]
  );

  // Process selected files - single file only
  const processFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      // Take only the first file for single file upload
      const firstFile = files[0];
      if (!firstFile) return;

      const { validFiles, invalidFiles } = validateFiles([firstFile]);

      // Handle valid file (replace existing)
      if (validFiles.length > 0) {
        const newUploadedFile: UploadedFile = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file: validFiles[0]!,
          status: 'pending' as const,
        };

        setUploadedFile(newUploadedFile);
        onFilesSelected?.(validFiles);
      }

      // Handle invalid files
      if (invalidFiles.length > 0) {
        onFilesRejected?.(invalidFiles);
      }
    },
    [onFilesSelected, onFilesRejected]
  );

  // Drag event handlers
  const onDragEnter = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current++;

      if (hasFiles(event.nativeEvent)) {
        updateDragState('dragover');
      } else {
        updateDragState('invalid');
      }
    },
    [updateDragState]
  );

  const onDragLeave = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current--;

      // Only update state when leaving the drop zone completely
      if (dragCounterRef.current === 0) {
        updateDragState('idle');
      }
    },
    [updateDragState]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Set dropEffect for visual feedback
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = hasFiles(event.nativeEvent)
        ? 'copy'
        : 'none';
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current = 0;
      updateDragState('idle');

      const files = getFilesFromDragEvent(event.nativeEvent);
      processFiles(files);
    },
    [updateDragState, processFiles]
  );

  // File input change handler
  const onFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        processFiles(fileListToArray(files));
      }

      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove file
  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  // Clear file (alias for removeFile)
  const clearFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  // Get input props
  const getInputProps = useCallback(
    (): React.InputHTMLAttributes<HTMLInputElement> => ({
      type: 'file',
      multiple: false, // Single file only
      accept: 'image/jpeg,image/png,image/webp,application/pdf',
      onChange: onFileInputChange,
      style: { display: 'none' },
      'aria-hidden': true,
      tabIndex: -1,
    }),
    [onFileInputChange]
  );

  // Get root props
  const getRootProps = useCallback(
    (): React.HTMLAttributes<HTMLDivElement> => ({
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDrop,
      role: 'button',
      tabIndex: 0,
      'aria-label':
        'File upload area. Click to browse or drag and drop a file here.',
      onKeyDown: event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFileDialog();
        }
      },
    }),
    [onDragEnter, onDragLeave, onDragOver, onDrop, openFileDialog]
  );

  return {
    // State
    dragState,
    isDragActive,
    uploadedFile,

    // Refs
    fileInputRef,
    dropZoneRef,

    // Handlers
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileInputChange,
    openFileDialog,
    removeFile,
    clearFile,

    // Utilities
    getInputProps,
    getRootProps,
  };
}
