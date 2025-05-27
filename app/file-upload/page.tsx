'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploadZone from '@/components/upload/FileUploadZone';

export default function FileUploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0 && files[0]) {
      const file = files[0];
      console.log('File selected:', file);
      setSelectedFile(file);
    }
  };

  const handleFilesRejected = (
    rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => {
    console.log('File rejected:', rejectedFiles[0]);
    // Handle rejected files (show error message, etc.)
  };

  const handleFileRemove = () => {
    console.log('File removed');
    setSelectedFile(null);
  };

  const handleBack = () => {
    router.push('/');
  };

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
          className="mb-8"
        />

        {/* Processing actions */}
        {selectedFile && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ready to Process
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your document <strong>{selectedFile.name}</strong> is ready for
              processing.
            </p>
            <div className="flex space-x-4">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Start Processing
              </button>
              <button
                type="button"
                onClick={handleFileRemove}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Remove File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
