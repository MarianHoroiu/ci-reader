'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, FileImage, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQwenAIExtraction } from '@/lib/hooks/useQwenAIExtraction';
import ProcessingStatus from '@/components/ai/ProcessingStatus';
import AIExtractionResults from '@/components/ai/AIExtractionResults';
import type { RomanianIDFields } from '@/lib/types/romanian-id-types';

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

export default function FileUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);

  // AI extraction hook
  const {
    isProcessing,
    result,
    error,
    isCancelled,
    isCompleted,
    startExtraction,
    cancelExtraction,
    resetExtraction,
    retryExtraction,
  } = useQwenAIExtraction();

  /**
   * Handle file selection
   */
  const handleFiles = useCallback((files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  /**
   * Handle drag events
   */
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  /**
   * Handle file input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  /**
   * Remove uploaded file
   */
  const removeFile = useCallback(
    (id: string) => {
      setUploadedFiles(prev => {
        const updated = prev.filter(f => f.id !== id);
        const removedFile = prev.find(f => f.id === id);
        if (removedFile) {
          URL.revokeObjectURL(removedFile.preview);
        }
        return updated;
      });

      // Reset current file if it was removed
      if (currentFile?.id === id) {
        setCurrentFile(null);
        resetExtraction();
      }
    },
    [currentFile, resetExtraction]
  );

  /**
   * Start AI processing for a file
   */
  const processFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      setCurrentFile(uploadedFile);

      try {
        await startExtraction(uploadedFile.file, {
          enhance_image: true,
          temperature: 0.1,
          max_tokens: 2000,
          onSuccess: extractionResult => {
            console.log('Extraction successful:', extractionResult);
          },
          onError: extractionError => {
            console.error('Extraction failed:', extractionError);
          },
        });
      } catch (err) {
        console.error('Failed to start extraction:', err);
      }
    },
    [startExtraction]
  );

  /**
   * Handle field updates from results component
   */
  const handleFieldsUpdate = useCallback((fields: RomanianIDFields) => {
    console.log('Fields updated:', fields);
    // Here you could save the updated fields to a database or state management
  }, []);

  /**
   * Handle export from results component
   */
  const handleExport = useCallback((format: 'json' | 'csv' | 'txt') => {
    console.log('Export requested:', format);
    // Additional export handling if needed
  }, []);

  /**
   * Reset and start over
   */
  const handleReset = useCallback(() => {
    setCurrentFile(null);
    resetExtraction();
  }, [resetExtraction]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Extragere Date Buletin Românesc
          </h1>
          <p className="text-lg text-gray-600">
            Încărcați o imagine cu buletin de identitate pentru extragerea
            automată a datelor
          </p>
        </div>

        {/* Upload Area */}
        {!isProcessing && !result && (
          <div className="mb-8">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Încărcați imaginile cu buletinul
              </h3>
              <p className="text-gray-600 mb-4">
                Trageți și plasați fișierele aici sau faceți clic pentru a
                selecta
              </p>
              <p className="text-sm text-gray-500">
                Formate acceptate: JPG, PNG, WEBP (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && !isProcessing && !result && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Fișiere Încărcate ({uploadedFiles.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map(uploadedFile => (
                <div
                  key={uploadedFile.id}
                  className="relative bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="mb-3">
                    <Image
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileImage className="w-4 h-4 mr-1" />
                      <span className="truncate">{uploadedFile.file.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>

                    <button
                      onClick={() => processFile(uploadedFile)}
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Procesează cu AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Status */}
        <ProcessingStatus
          isProcessing={isProcessing}
          error={error}
          isCancelled={isCancelled}
          isCompleted={isCompleted}
          {...(currentFile?.file.name && { fileName: currentFile.file.name })}
          {...(currentFile?.file.size && { fileSize: currentFile.file.size })}
          onCancel={cancelExtraction}
          onRetry={retryExtraction}
          onReset={handleReset}
          className="mb-8"
        />

        {/* Extraction Results */}
        {result && (
          <AIExtractionResults
            result={result}
            editable={true}
            onFieldsUpdate={handleFieldsUpdate}
            onExport={handleExport}
            className="mb-8"
            showConfidence={true}
            showMetadata={true}
          />
        )}

        {/* Instructions */}
        {!isProcessing && !result && uploadedFiles.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Instrucțiuni de utilizare
            </h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Încărcați imaginea:</strong> Selectați o fotografie
                  clară a buletinului de identitate românesc
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Calitatea imaginii:</strong> Asigurați-vă că textul
                  este lizibil și imaginea nu este blurată
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Procesare AI:</strong> Sistemul va extrage automat
                  toate datele relevante din document
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Verificare și editare:</strong> Puteți verifica și
                  edita datele extrase înainte de export
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-yellow-800">Notă importantă:</strong>
                  <p className="text-yellow-700 mt-1">
                    Acest sistem folosește inteligența artificială pentru
                    extragerea datelor. Vă recomandăm să verificați întotdeauna
                    acuratețea informațiilor extrase înainte de a le utiliza în
                    scopuri oficiale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
