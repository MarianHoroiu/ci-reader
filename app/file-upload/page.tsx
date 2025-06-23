'use client';

import React, { useState, useCallback } from 'react';
import { Cloud } from 'lucide-react';
import type { AIVisionOCRResponse } from '@/lib/types/romanian-id-types';
import AIExtractionResults from '@/components/ai/AIExtractionResults';
import FileUploadLayout from '@/components/upload/FileUploadLayout';
import FileDropZone from '@/components/upload/FileDropZone';
import ProcessingStatusCard from '@/components/upload/ProcessingStatusCard';
import StandardProcessingButton from '@/components/upload/StandardProcessingButton';
import ErrorBoundaryCard from '@/components/upload/ErrorBoundaryCard';
import InstructionsCard from '@/components/upload/InstructionsCard';
import ProcessingModeSelector from '@/components/upload/ProcessingModeSelector';
import Image from 'next/image';

export default function FileUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [currentFile, setCurrentFile] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIVisionOCRResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<
    'form' | 'high_quality' | 'low_cost'
  >('form');

  const handleFiles = useCallback(
    (files: FileList) => {
      if (files.length === 0) return;
      if (uploadedFiles.length > 0) return; // Prevent adding more than one
      const file = files[0];
      if (!file) return;
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValidType || !isValidSize) return;
      const newFile = {
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      };
      setUploadedFiles([newFile]);
      setCurrentFile(newFile);
    },
    [uploadedFiles]
  );

  const processWithWhisperer = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setResult(null);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('mode', processingMode);
        const response = await fetch('/api/llm-whisperer-ocr', {
          method: 'POST',
          body: formData,
        });
        const result: AIVisionOCRResponse = await response.json();
        if (result.success) {
          setResult(result);
        } else {
          setError(result.error?.message || 'Cloud processing failed');
        }
      } catch (err: any) {
        setError(err.message || 'Cloud processing failed');
      } finally {
        setIsProcessing(false);
      }
    },
    [processingMode]
  );

  const handleProcess = useCallback(() => {
    if (!currentFile) return;
    processWithWhisperer(currentFile.file);
  }, [currentFile, processWithWhisperer]);

  const handleReset = useCallback(() => {
    setUploadedFiles([]);
    setCurrentFile(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <FileUploadLayout
      title="Romanian ID Processing"
      mode={
        processingModes.find(mode => mode.id === processingMode)?.name || 'Form'
      }
    >
      {/* Upload Area - Only shown when no files uploaded */}
      {uploadedFiles.length === 0 && !isProcessing && !result && (
        <div className="mb-8">
          <FileDropZone
            onFilesSelected={handleFiles}
            accept="image/*"
            maxSize={10 * 1024 * 1024}
            disabled={uploadedFiles.length > 0}
          />
        </div>
      )}

      {/* Processing Mode Selector - Only shown when no files uploaded */}
      {uploadedFiles.length === 0 && !isProcessing && !result && (
        <div className="mb-8">
          <h3 className="text-lg text-center font-medium text-gray-900 mb-4">
            Select Processing Mode
          </h3>
          <ProcessingModeSelector
            modes={processingModes}
            selectedMode={processingMode}
            onModeSelect={modeId =>
              setProcessingMode(modeId as 'form' | 'high_quality' | 'low_cost')
            }
          />
        </div>
      )}

      {/* Two-Column Layout for Extraction Process */}
      {uploadedFiles.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - ID Card Image */}
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ID Card Image
              </h3>
              {currentFile && (
                <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                  <div className="aspect-[16/10] relative">
                    <Image
                      src={currentFile.preview}
                      alt="Uploaded ID Card"
                      width={800}
                      height={800}
                      className="object-contain bg-gray-50"
                    />
                  </div>
                  <div className="p-4 border-t">
                    <p className="text-sm text-gray-600 truncate">
                      {currentFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(currentFile.file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Processing Controls & Results */}
            <div className="space-y-4 text-center">
              {/* <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Processing & Results
              </h3> */}

              {/* Processing Button - Only shown when file uploaded but not processing and no results */}
              {!isProcessing && !result && !error && (
                <div className="h-full flex items-center justify-center">
                  <StandardProcessingButton
                    icon={<Cloud className="w-6 h-6" />}
                    text="Process using Artificial Intelligence"
                    modelName="LLM Whisperer API"
                    color="purple"
                    onClick={handleProcess}
                    disabled={isProcessing}
                    size="lg"
                  />
                </div>
              )}

              {/* Processing Status */}
              {isProcessing && (
                <div className="h-full flex items-center justify-center">
                  <ProcessingStatusCard
                    isProcessing={isProcessing}
                    title="Processing..."
                    description="Document is being analyzed using Cloud Model of Artificial Intelligence"
                    onCancel={handleReset}
                  />
                </div>
              )}

              {/* Error State */}
              {error && (
                <ErrorBoundaryCard
                  error={error}
                  onReset={handleReset}
                  title="Processing Error"
                />
              )}

              {/* Extraction Results */}
              {result && result.data && (
                <div className="h-full">
                  <AIExtractionResults
                    result={result.data}
                    editable={true}
                    onClear={handleReset}
                    isNewData={true}
                    compactLayout={true}
                    className="h-full max-h-[800px] overflow-auto"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions - Only shown when no files uploaded */}
      {!isProcessing && !result && uploadedFiles.length === 0 && (
        <InstructionsCard
          type="warning"
          title="Important Note:"
          className="mt-6"
        >
          <p>
            This system uses artificial intelligence for data extraction. We
            recommend you always verify the accuracy of the extracted
            information before using it for official purposes. You have the
            option to edit the extracted data before exporting.
          </p>
        </InstructionsCard>
      )}
    </FileUploadLayout>
  );
}

export const processingModes = [
  {
    id: 'form',
    name: 'Form' as const,
    description: 'Best for ID documents',
    icon: <Cloud className="w-5 h-5 text-purple-600" />,
  },
  {
    id: 'high_quality',
    name: 'High-Quality' as const,
    description: 'Slower, more accurate',
    icon: <Cloud className="w-5 h-5 text-purple-600" />,
  },
  {
    id: 'low_cost',
    name: 'Low-Cost' as const,
    description: 'Faster, less accurate',
    icon: <Cloud className="w-5 h-5 text-purple-600" />,
  },
];
