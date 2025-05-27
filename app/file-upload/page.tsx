/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFileUploadWithProgress } from '@/hooks/useFileUploadWithProgress';
import FileUploadZone from '@/components/upload/FileUploadZone';
import UploadStatus from '@/components/upload/UploadStatus';
import StatusMessage from '@/components/upload/StatusMessage';
import CancelButton from '@/components/upload/CancelButton';
import {
  formatBytes,
  formatSpeed,
  formatTimeRemaining,
} from '@/lib/utils/progress-calculator';

export default function FileUploadPage() {
  const router = useRouter();
  const [showUploadButton, setShowUploadButton] = useState(false);

  const {
    selectedFile,
    uploadedFile,
    isUploading,
    uploadProgress,
    uploadSpeed,
    timeRemaining,
    currentPhase,
    selectFile,
    startUpload,
    cancelUpload,
    removeFile,
    progressHook,
  } = useFileUploadWithProgress({
    onUploadComplete: (file, response) => {
      console.log('Upload completed:', { file: file.name, response });
      setShowUploadButton(false);
    },
    onUploadError: (file, error) => {
      console.error('Upload failed:', { file: file.name, error });
    },
  });

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0 && files[0]) {
      selectFile(files[0]);
      setShowUploadButton(true);
    }
  };

  const handleFilesRejected = (
    rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => {
    console.log('File rejected:', rejectedFiles[0]);
  };

  const handleFileRemove = () => {
    removeFile();
    setShowUploadButton(false);
  };

  const handleStartUpload = async () => {
    if (selectedFile) {
      await startUpload();
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  // Get current progress state for display
  const currentFileId =
    progressHook.progress.size > 0
      ? Array.from(progressHook.progress.keys())[0]
      : null;
  const currentProgress = currentFileId
    ? progressHook.getProgress(currentFileId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back navigation */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
            type="button"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Romanian ID Document Upload
            </h1>
            <p className="text-lg text-gray-600">
              Upload your Romanian ID document for processing
            </p>
          </div>
        </div>

        {/* File upload component */}
        <FileUploadZone
          onFilesSelected={handleFilesSelected}
          onFilesRejected={handleFilesRejected}
          onFileRemove={handleFileRemove}
          disabled={isUploading}
          className="mb-8"
        />

        {/* Upload button */}
        {showUploadButton && selectedFile && !isUploading && !uploadedFile && (
          <div className="mb-8 text-center">
            <button
              onClick={handleStartUpload}
              className="
                inline-flex items-center px-6 py-3 border border-transparent 
                text-base font-medium rounded-md text-white bg-primary-600 
                hover:bg-primary-700 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-primary-500 transition-colors
              "
            >
              <svg
                className="w-5 h-5 mr-2"
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
              Start Processing
            </button>
          </div>
        )}

        {/* Progress indicators */}
        {isUploading && selectedFile && currentProgress && currentFileId && (
          <div className="mb-8 space-y-6">
            {/* Status message */}
            <StatusMessage
              phase={currentProgress.phase}
              variant="banner"
              className="mb-4"
            />

            {/* Upload status component */}
            <UploadStatus
              fileId={currentFileId}
              fileName={selectedFile.name}
              fileSize={selectedFile.size}
              progress={currentProgress}
              variant="detailed"
              onCancel={cancelUpload}
              className="mb-4"
            />

            {/* Additional progress info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Processing Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {uploadProgress.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Progress</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadSpeed > 0 ? formatSpeed(uploadSpeed) : '--'}
                  </div>
                  <div className="text-sm text-gray-500">Speed</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {timeRemaining > 0
                      ? formatTimeRemaining(timeRemaining)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-500">Time Remaining</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Phase:{' '}
                    <span className="font-medium capitalize">
                      {currentPhase}
                    </span>
                  </span>
                  <span>
                    {formatBytes(currentProgress.bytesLoaded)} /{' '}
                    {formatBytes(currentProgress.bytesTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel button */}
            <div className="text-center">
              <CancelButton
                onCancel={cancelUpload}
                variant="default"
                size="lg"
                confirmRequired={true}
                confirmMessage="Are you sure you want to cancel this upload?"
              />
            </div>
          </div>
        )}

        {/* Success state */}
        {uploadedFile && uploadedFile.status === 'success' && (
          <div className="mb-8">
            <StatusMessage
              phase="complete"
              message="Upload completed successfully!"
              details={
                'Your file ' +
                uploadedFile.file.name +
                ' has been uploaded and processed.'
              }
              variant="banner"
              className="mb-4"
            />

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg
                  className="w-8 h-8 text-green-600 mr-4"
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
                <div>
                  <h3 className="text-lg font-medium text-green-800">
                    Processing Complete
                  </h3>
                  <p className="text-green-700">
                    File: {uploadedFile.file.name} (
                    {formatBytes(uploadedFile.file.size)})
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Your document is ready for data extraction and template
                    filling.
                  </p>
                </div>
              </div>

              {/* Next steps */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Extract Data
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeFile();
                      setShowUploadButton(false);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {uploadedFile && uploadedFile.status === 'error' && (
          <div className="mb-8">
            <StatusMessage
              phase="error"
              message="Upload failed"
              details={
                uploadedFile.error || 'An unknown error occurred during upload.'
              }
              variant="banner"
              className="mb-4"
            />

            <div className="text-center">
              <button
                onClick={() => {
                  removeFile();
                  setShowUploadButton(false);
                }}
                className="
                  inline-flex items-center px-4 py-2 border border-gray-300 
                  text-sm font-medium rounded-md text-gray-700 bg-white 
                  hover:bg-gray-50 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-primary-500 transition-colors
                "
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            💡 How to Use
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Select your Romanian ID document (JPG, PNG, WEBP, or PDF)</li>
            <li>
              • Click "Start Processing" to upload and process your document
            </li>
            <li>• Watch the real-time progress indicators during upload</li>
            <li>
              • Once complete, you can extract data or upload another document
            </li>
          </ul>

          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <p className="text-xs text-blue-600">
              <strong>For testing:</strong> Use browser dev tools to throttle
              network to "Slow 3G" to see detailed progress indicators during
              upload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
