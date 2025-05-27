'use client';

import { useCallback } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import FileDropArea from './FileDropArea';
import FileBrowser from './FileBrowser';
import { formatFileSize } from '@/lib/utils/file-upload';

export interface FileUploadZoneProps {
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected?: (_files: File[]) => void;
  onFilesRejected?: (
    _rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => void;
  onFileRemove?: (_fileId: string) => void;
  showFileList?: boolean;
  maxHeight?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function FileUploadZone({
  multiple = true,
  disabled = false,
  onFilesSelected,
  onFilesRejected,
  onFileRemove,
  showFileList = true,
  maxHeight = 'max-h-96',
  className = '',
  children,
}: FileUploadZoneProps) {
  const {
    dragState,
    isDragActive,
    uploadedFiles,
    fileInputRef,
    dropZoneRef,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    openFileDialog,
    removeFile,
    clearFiles,
    getInputProps,
  } = useFileUpload({
    multiple,
    ...(onFilesSelected && { onFilesSelected }),
    ...(onFilesRejected && { onFilesRejected }),
  });

  const handleFileRemove = useCallback(
    (fileId: string) => {
      removeFile(fileId);
      onFileRemove?.(fileId);
    },
    [removeFile, onFileRemove]
  );

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      onFilesSelected?.(files);
    },
    [onFilesSelected]
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden file input */}
      <input {...getInputProps()} ref={fileInputRef} />

      {/* Main drop area */}
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
        className="p-8 text-center"
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
                  ? 'Drop files here'
                  : 'Upload Romanian ID Documents'}
              </h3>
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Release to upload your files'
                  : 'Drag and drop your files here, or click to browse'}
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
                multiple={multiple}
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

      {/* File list */}
      {showFileList && uploadedFiles.length > 0 && (
        <div className={`mt-6 ${maxHeight} overflow-y-auto`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({uploadedFiles.length})
            </h4>
            {uploadedFiles.length > 1 && (
              <button
                onClick={clearFiles}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                type="button"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            {uploadedFiles.map(uploadedFile => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* File icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.file.type.startsWith('image/') ? (
                      <svg
                        className="w-5 h-5 text-blue-500"
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
                        className="w-5 h-5 text-red-500"
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

                {/* Remove button */}
                <button
                  onClick={() => handleFileRemove(uploadedFile.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  type="button"
                  aria-label={`Remove ${uploadedFile.file.name}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
