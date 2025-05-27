'use client';

import { useCallback, useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import FileDropArea from './FileDropArea';
import FileBrowser from './FileBrowser';
import ValidationMessage from './ValidationMessage';
import { formatFileSize } from '@/lib/utils/file-upload';

export interface FileUploadZoneProps {
  disabled?: boolean;
  onFilesSelected?: (_files: File[]) => void;
  onFilesRejected?: (
    _rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => void;
  onFileRemove?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUploadZone({
  disabled = false,
  onFilesSelected,
  onFilesRejected,
  onFileRemove,
  className = '',
  children,
}: FileUploadZoneProps) {
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState<
    Array<{
      file: File;
      error: string;
      errorCode: string;
    }>
  >([]);

  const handleFilesRejected = useCallback(
    (
      rejectedFiles: Array<{
        file: File;
        error: string;
        errorCode: string;
      }>
    ) => {
      setValidationErrors(rejectedFiles);
      onFilesRejected?.(rejectedFiles);
    },
    [onFilesRejected]
  );

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      // Clear validation errors when valid files are selected
      setValidationErrors([]);
      onFilesSelected?.(files);
    },
    [onFilesSelected]
  );

  const {
    dragState,
    isDragActive,
    uploadedFile,
    fileInputRef,
    dropZoneRef,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    openFileDialog,
    removeFile,
    getInputProps,
  } = useFileUpload({
    onFilesSelected: handleFilesSelected,
    onFilesRejected: handleFilesRejected,
  });

  const handleFileRemove = useCallback(() => {
    removeFile();
    setValidationErrors([]); // Clear errors when file is removed
    onFileRemove?.();
  }, [removeFile, onFileRemove]);

  const dismissValidationError = useCallback((index: number) => {
    setValidationErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden file input */}
      <input {...getInputProps()} ref={fileInputRef} />

      {/* Main upload container with background SVG */}
      <div className="bg-white rounded-lg shadow-lg p-6 relative overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Romanian ID Documents
        </h2>

        {/* Background SVG Icon */}
        <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
          <svg
            width="120"
            height="120"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Drop area */}
        <FileDropArea
          ref={dropZoneRef}
          dragState={dragState}
          isDragActive={isDragActive}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          {...(!disabled && { onClick: openFileDialog })}
          disabled={disabled}
          className="p-8 text-center relative z-10"
        >
          {children || (
            <div className="space-y-4">
              {/* Upload icon */}
              <div className="mx-auto w-16 h-16 text-gray-400">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              {/* Main text */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {isDragActive
                    ? dragState === 'invalid'
                      ? 'Invalid file type'
                      : 'Drop file here'
                    : 'Upload Romanian ID Document'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? dragState === 'invalid'
                      ? 'This file type is not supported'
                      : 'Release to upload your file'
                    : 'Drag and drop your file here, or click to browse'}
                </p>
              </div>

              {/* Supported formats */}
              <div className="text-xs text-gray-500">
                <p>Supported formats: JPG, PNG, WEBP, PDF</p>
                <p>Maximum file size: 10MB</p>
              </div>

              {/* Browse button */}
              <div className="pt-2">
                <FileBrowser
                  ref={fileInputRef}
                  disabled={disabled}
                  onFileSelect={handleFilesSelected}
                  buttonText="Browse Files"
                  buttonVariant="primary"
                  buttonSize="md"
                />
              </div>
            </div>
          )}
        </FileDropArea>

        {/* Validation errors display */}
        {validationErrors.length > 0 && (
          <div className="mt-6 space-y-3">
            {validationErrors.map((error, index) => (
              <ValidationMessage
                key={`${error.file.name}-${index}`}
                message={error.error}
                errorCode={error.errorCode as any}
                onDismiss={() => dismissValidationError(index)}
                className="animate-in slide-in-from-top-2 duration-300"
              />
            ))}
          </div>
        )}

        {/* Selected file display */}
        {uploadedFile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* File icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.file.type.startsWith('image/') ? (
                    <svg
                      className="w-6 h-6 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
              </div>

              {/* Remove button with red bin icon */}
              <button
                onClick={handleFileRemove}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                type="button"
                aria-label={`Remove ${uploadedFile.file.name}`}
                title="Remove file"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
