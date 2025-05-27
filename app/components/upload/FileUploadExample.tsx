'use client';

import React, { useState } from 'react';
import FileUploadZone from './FileUploadZone';

/**
 * Example component demonstrating how to use FileUploadZone with validation feedback
 * This shows the complete integration with error handling
 */
export default function FileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesSelected = (files: File[]) => {
    console.log('✅ Valid files selected:', files);
    setUploadedFiles(files);
  };

  const handleFilesRejected = (
    rejectedFiles: Array<{
      file: File;
      error: string;
      errorCode: string;
    }>
  ) => {
    console.log('❌ Files rejected:', rejectedFiles);
    // The FileUploadZone will automatically show validation errors in the UI
    // You can also add additional logic here like analytics tracking
  };

  const handleFileRemove = () => {
    console.log('🗑️ File removed');
    setUploadedFiles([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        File Upload with Validation
      </h1>

      <FileUploadZone
        onFilesSelected={handleFilesSelected}
        onFilesRejected={handleFilesRejected}
        onFileRemove={handleFileRemove}
        className="mb-6"
      />

      {/* Display uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            ✅ Files Ready for Processing
          </h3>
          <ul className="space-y-1">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="text-sm text-green-700">
                📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          💡 Try These Test Cases
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• ✅ Upload a valid JPG, PNG, WEBP, or PDF file</li>
          <li>• ❌ Try uploading an XLSX file (should show error)</li>
          <li>
            • ❌ Try uploading a file larger than 10MB (should show error)
          </li>
          <li>
            • ❌ Try uploading a text file with wrong extension (should show
            error)
          </li>
        </ul>
      </div>
    </div>
  );
}
