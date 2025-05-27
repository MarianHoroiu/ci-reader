'use client';

import { useState } from 'react';
import FileUploadZone from '@/components/upload/FileUploadZone';

export default function UploadDemoPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<
    Array<{ file: File; error: string; errorCode: string }>
  >([]);

  const handleFilesSelected = (files: File[]) => {
    console.log('Files selected:', files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFilesRejected = (
    rejectedFiles: Array<{ file: File; error: string; errorCode: string }>
  ) => {
    console.log('Files rejected:', rejectedFiles);
    setRejectedFiles(prev => [...prev, ...rejectedFiles]);
  };

  const handleFileRemove = (fileId: string) => {
    console.log('File removed:', fileId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            File Upload Component Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the Romanian ID document upload functionality
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Upload Romanian ID Documents
          </h2>

          <FileUploadZone
            multiple={true}
            onFilesSelected={handleFilesSelected}
            onFilesRejected={handleFilesRejected}
            onFileRemove={handleFileRemove}
            showFileList={true}
            className="mb-6"
          />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2">
              {selectedFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No files selected yet</p>
              ) : (
                selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Rejected Files ({rejectedFiles.length})
            </h3>
            <div className="space-y-2">
              {rejectedFiles.length === 0 ? (
                <p className="text-gray-500 text-sm">No rejected files</p>
              ) : (
                rejectedFiles.map((rejected, index) => (
                  <div
                    key={index}
                    className="p-2 bg-red-50 rounded border border-red-200"
                  >
                    <p className="text-sm font-medium text-red-900 truncate">
                      {rejected.file.name}
                    </p>
                    <p className="text-xs text-red-600">{rejected.error}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            How to Test
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Drag and drop files onto the upload area</li>
            <li>
              • Click &ldquo;Browse Files&rdquo; to select files using the file
              dialog
            </li>
            <li>• Try uploading supported formats: JPG, PNG, WEBP, PDF</li>
            <li>• Try uploading unsupported formats to see validation</li>
            <li>• Try uploading files larger than 10MB to test size limits</li>
            <li>
              • Use keyboard navigation (Tab, Enter, Space) to test
              accessibility
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
