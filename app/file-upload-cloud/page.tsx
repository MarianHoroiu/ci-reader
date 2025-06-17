'use client';

import React, { useState, useCallback } from 'react';
import { Cloud } from 'lucide-react';
import type { AIVisionOCRResponse } from '@/lib/types/romanian-id-types';
import AIExtractionResults from '@/components/ai/AIExtractionResults';
import FileUploadLayout from '@/components/upload/FileUploadLayout';
import FileDropZone from '@/components/upload/FileDropZone';
import FilePreviewCard from '@/components/upload/FilePreviewCard';
import ProcessingStatusCard from '@/components/upload/ProcessingStatusCard';
import StandardProcessingButton from '@/components/upload/StandardProcessingButton';
import ErrorBoundaryCard from '@/components/upload/ErrorBoundaryCard';
import InstructionsCard from '@/components/upload/InstructionsCard';
import ProcessingModeSelector from '@/components/upload/ProcessingModeSelector';

export default function FileUploadCloudPage() {
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
      if (currentFile?.id === id) {
        setCurrentFile(null);
        setResult(null);
        setError(null);
      }
    },
    [currentFile]
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
      title="Cloud Model Processing"
      mode={
        processingModes.find(mode => mode.id === processingMode)?.name || 'Form'
      }
    >
      {/* Upload Area */}
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

      {/* Processing Mode Selector */}
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

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && !isProcessing && !result && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map(uploadedFile => (
              <FilePreviewCard
                key={uploadedFile.id}
                file={uploadedFile}
                onRemove={removeFile}
                isSelected={currentFile?.id === uploadedFile.id}
                onSelect={setCurrentFile}
              >
                <StandardProcessingButton
                  icon={<Cloud className="w-6 h-6" />}
                  text={
                    isProcessing
                      ? 'Processing...'
                      : 'Process with Cloud AI Model'
                  }
                  modelName="LLM Whisperer API"
                  color="purple"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  size="sm"
                />
              </FilePreviewCard>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      <ProcessingStatusCard
        isProcessing={isProcessing}
        title="Processing..."
        description="Document is being analyzed using Cloud Model of Artificial Intelligence"
        onCancel={handleReset}
        className="mb-8"
      />

      {/* Error State */}
      {error && (
        <ErrorBoundaryCard
          error={error}
          onReset={handleReset}
          title="Processing Error"
          className="mb-8"
        />
      )}

      {/* Extraction Results */}
      {result && result.data && (
        <AIExtractionResults
          result={result.data}
          editable={false}
          className="mb-8"
        />
      )}

      {/* Instructions */}
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
