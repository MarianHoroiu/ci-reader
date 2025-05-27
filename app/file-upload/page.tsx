/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFileUploadWithProgress } from '@/hooks/useFileUploadWithProgress';
import FileUploadWithErrorHandling from '@/components/upload/FileUploadWithErrorHandling';
import UploadStatus from '@/components/upload/UploadStatus';
import StatusMessage from '@/components/upload/StatusMessage';
import CancelButton from '@/components/upload/CancelButton';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';
import { type ErrorContext } from '@/lib/constants/error-messages';
import {
  formatBytes,
  formatSpeed,
  formatTimeRemaining,
} from '@/lib/utils/progress-calculator';

export default function FileUploadPage() {
  const router = useRouter();
  const [showUploadButton, setShowUploadButton] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

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

  const handleFilesUploaded = (files: File[]) => {
    if (files.length > 0 && files[0]) {
      selectFile(files[0]);
      setShowUploadButton(true);
    }
  };

  const handleValidationError = (
    errorCode: ValidationErrorCode,
    context?: ErrorContext
  ) => {
    console.log('Validation error occurred:', errorCode, context);
    // Reset upload state when validation fails
    setShowUploadButton(false);
  };

  const handleFileRemove = () => {
    removeFile();
    setShowUploadButton(false);
    setProcessingComplete(false);
  };

  const handleStartUpload = async () => {
    if (selectedFile) {
      await startUpload();
    }
  };

  const handleExtractData = async () => {
    if (!uploadedFile || uploadedFile.status !== 'success') return;

    setIsProcessing(true);

    try {
      // Simulate data extraction process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingComplete(true);
    } catch (error) {
      console.error('Data extraction failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAnother = () => {
    // Clear all state
    removeFile();
    setShowUploadButton(false);
    setProcessingComplete(false);
    setIsProcessing(false);

    // Trigger file picker
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    fileInput.onchange = e => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFilesUploaded(Array.from(files));
      }
    };
    fileInput.click();
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

        {/* File upload component with comprehensive error handling */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <FileUploadWithErrorHandling
            onFilesUploaded={handleFilesUploaded}
            onValidationError={handleValidationError}
            showToasts={true}
            showDetailedErrors={true}
            maxFiles={1}
            className="min-h-32"
          />
        </div>

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
              Upload File
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

        {/* File uploaded - ready for processing */}
        {uploadedFile &&
          uploadedFile.status === 'success' &&
          !processingComplete && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mr-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">
                      File Uploaded Successfully
                    </h3>
                    <p className="text-blue-700">
                      File: {uploadedFile.file.name} (
                      {formatBytes(uploadedFile.file.size)})
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Ready for data extraction processing.
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleExtractData}
                      disabled={isProcessing}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Extract Data'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadAnother}
                      disabled={isProcessing}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Upload Another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Processing complete state */}
        {processingComplete && uploadedFile && (
          <div className="mb-8">
            <StatusMessage
              phase="complete"
              message="Processing Complete!"
              details={
                'Data extraction from ' +
                uploadedFile.file.name +
                ' has been completed successfully.'
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
                    Data Extraction Complete
                  </h3>
                  <p className="text-green-700">
                    File: {uploadedFile.file.name} (
                    {formatBytes(uploadedFile.file.size)})
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Your document data has been extracted and is ready for
                    template filling.
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
                    View Extracted Data
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadAnother}
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
                onClick={handleFileRemove}
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
      </div>
    </div>
  );
}
