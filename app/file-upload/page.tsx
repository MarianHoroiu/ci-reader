/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFileUploadWithProgress } from '@/hooks/useFileUploadWithProgress';
import { useRomanianIDEnhancedOCR } from '@/lib/hooks/useEnhancedOCR';
import FileUploadWithErrorHandling from '@/components/upload/FileUploadWithErrorHandling';
import UploadStatus from '@/components/upload/UploadStatus';
import StatusMessage from '@/components/upload/StatusMessage';
import CancelButton from '@/components/upload/CancelButton';
import { type ValidationErrorCode } from '@/lib/constants/supported-formats';
import { type ErrorContext } from '@/lib/constants/error-messages';
import type { OCRProgress } from '@/lib/ocr/ocr-types';
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
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);

  // Initialize enhanced OCR hook for Romanian ID processing with preprocessing
  const ocrHook = useRomanianIDEnhancedOCR();

  // Handle OCR state changes
  useEffect(() => {
    if (ocrHook.progress) {
      setOcrProgress(ocrHook.progress);
    }
  }, [ocrHook.progress]);

  // Handle preprocessing state
  useEffect(() => {
    if (ocrHook.isPreprocessing) {
      setOcrProgress({
        status: 'loading',
        progress: 25,
        message: 'Enhancing image quality for better OCR...',
        stage: 'preprocessing',
      });
    }
  }, [ocrHook.isPreprocessing]);

  useEffect(() => {
    if (ocrHook.extractedData) {
      console.log('Received extracted data in UI:', ocrHook.extractedData);
      setExtractedData(ocrHook.extractedData);
      setProcessingComplete(true);
      setIsProcessing(false);
    }
  }, [ocrHook.extractedData]);

  useEffect(() => {
    if (ocrHook.error) {
      console.error('OCR processing failed:', ocrHook.error);
      setIsProcessing(false);
    }
  }, [ocrHook.error]);

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

  // Reset OCR state when selectedFile changes (new file selected)
  useEffect(() => {
    if (selectedFile) {
      // Clear previous OCR results when a new file is selected
      setExtractedData(null);
      setProcessingComplete(false);
      setOcrProgress(null);
    }
  }, [selectedFile]);

  const handleFilesUploaded = (files: File[]) => {
    if (files.length > 0 && files[0]) {
      console.log('📁 New file selected:', files[0].name);
      // Reset all OCR state when new file is selected
      ocrHook.reset();
      setExtractedData(null);
      setProcessingComplete(false);
      setIsProcessing(false);
      setOcrProgress(null);

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
    // Reset OCR state when file is removed
    ocrHook.reset();
    removeFile();
    setShowUploadButton(false);
    setProcessingComplete(false);
    setExtractedData(null);
    setOcrProgress(null);
  };

  const handleStartUpload = async () => {
    if (selectedFile) {
      await startUpload();
    }
  };

  const handleExtractData = async () => {
    if (!uploadedFile || uploadedFile.status !== 'success') return;

    // Check if it's a PDF file and show warning
    if (uploadedFile.file.type === 'application/pdf') {
      alert(
        'PDF files are not currently supported for OCR processing. Please upload a PNG or JPEG image of your Romanian ID instead.'
      );
      return;
    }

    // Reset all OCR state before processing
    ocrHook.reset();
    setIsProcessing(true);
    setExtractedData(null);
    setProcessingComplete(false);
    setOcrProgress(null);

    try {
      // Use enhanced OCR with preprocessing for better accuracy
      await ocrHook.processRomanianIDWithPreprocessing(uploadedFile.file);
    } catch (error) {
      console.error('Data extraction failed:', error);
      setIsProcessing(false);
    }
  };

  const handleUploadAnother = () => {
    // Clear all state including OCR state
    ocrHook.reset();
    removeFile();
    setShowUploadButton(false);
    setProcessingComplete(false);
    setIsProcessing(false);
    setExtractedData(null);
    setShowExtractedData(false);
    setOcrProgress(null);

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
                          {ocrProgress
                            ? `${ocrProgress.stage} (${ocrProgress.progress.toFixed(0)}%)`
                            : 'Processing...'}
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
                    onClick={() => setShowExtractedData(true)}
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

        {/* Extracted Data Modal */}
        {showExtractedData && extractedData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Extracted Data
                  </h2>
                  <button
                    onClick={() => setShowExtractedData(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* OCR Results Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Processing Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {extractedData.confidence.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {extractedData.words?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {extractedData.lines?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">Lines</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {extractedData.processingTime}ms
                        </div>
                        <div className="text-sm text-gray-500">Time</div>
                      </div>
                    </div>

                    {/* Preprocessing Enhancement Indicator */}
                    {ocrHook.preprocessedImage && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Enhanced with image preprocessing (DPI:{' '}
                            {ocrHook.preprocessedImage.settings.dpi}, Contrast:{' '}
                            {ocrHook.preprocessedImage.settings.contrast})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extracted Text */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Extracted Text
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {extractedData.text || 'No text extracted'}
                      </pre>
                    </div>
                  </div>

                  {/* Parsed Romanian ID Fields */}
                  {extractedData.fields &&
                    Object.keys(extractedData.fields).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Extracted Romanian ID Fields
                        </h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="grid gap-3">
                            {Object.entries(extractedData.fields).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
                                >
                                  <span className="font-medium text-gray-700 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-gray-900 text-right max-w-xs">
                                    {String(value) || 'Not detected'}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Word-level Details */}
                  {extractedData.words && extractedData.words.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Word-level Analysis
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="grid gap-2">
                          {extractedData.words
                            .slice(0, 20)
                            .map((word: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                              >
                                <span className="font-mono text-sm">
                                  {word.text}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {word.confidence.toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          {extractedData.words.length > 20 && (
                            <div className="text-center text-sm text-gray-500 pt-2">
                              ... and {extractedData.words.length - 20} more
                              words
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowExtractedData(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extractedData.text);
                      // You could add a toast notification here
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy Text
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
