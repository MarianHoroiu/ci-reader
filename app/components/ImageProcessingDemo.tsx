'use client';

import React, { useState, useCallback } from 'react';
import {
  Upload,
  Settings,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  processImageForAI,
  getProcessingRecommendations,
} from '@/lib/image-processing/image-processor';
import { quickValidateFile } from '@/lib/utils/image-validation';
import type {
  ImageProcessingOptions,
  ProcessingResult,
} from '@/lib/types/image-processing-types';

interface ProcessingState {
  isProcessing: boolean;
  result: ProcessingResult | null;
  error: string | null;
  recommendations: string[];
}

export default function ImageProcessingDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    result: null,
    error: null,
    recommendations: [],
  });
  const [options, setOptions] = useState<Partial<ImageProcessingOptions>>({
    autoRotate: true,
    enhanceQuality: true,
    reduceNoise: true,
    preserveAspectRatio: true,
  });

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Quick validation
      const validation = quickValidateFile(file);
      if (!validation.isValid) {
        setProcessingState(prev => ({
          ...prev,
          error: validation.error || 'Invalid file',
          result: null,
        }));
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setProcessingState({
        isProcessing: false,
        result: null,
        error: null,
        recommendations: [],
      });

      // Get processing recommendations
      try {
        const { recommendations } = await getProcessingRecommendations(file);
        setProcessingState(prev => ({
          ...prev,
          recommendations,
        }));
      } catch (error) {
        console.error('Failed to get recommendations:', error);
      }
    },
    []
  );

  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;

    setProcessingState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
    }));

    try {
      const result = await processImageForAI(selectedFile, options);
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        result,
      }));
    } catch (error) {
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      }));
    }
  }, [selectedFile, options]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getQualityColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number): string => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.5) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Image Preprocessing Pipeline Demo
        </h1>
        <p className="text-gray-600">
          Optimized for Romanian ID document processing with
          Qwen2.5-VL-7B-Instruct
        </p>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Upload className="mr-2" size={20} />
          Upload Image
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Choose an image file
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, WebP, HEIC (max 10MB)
            </p>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={20} />
            </div>
          </div>
        )}
      </div>

      {/* Processing Options */}
      {selectedFile && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Settings className="mr-2" size={20} />
            Processing Options
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.autoRotate}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    autoRotate: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">Auto Rotate</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.enhanceQuality}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    enhanceQuality: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">Enhance Quality</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.reduceNoise}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    reduceNoise: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">Reduce Noise</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.preserveAspectRatio}
                onChange={e =>
                  setOptions(prev => ({
                    ...prev,
                    preserveAspectRatio: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <span className="text-sm">Preserve Aspect</span>
            </label>
          </div>

          {processingState.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                <Info className="mr-2" size={16} />
                Recommendations
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {processingState.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={processingState.isProcessing}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingState.isProcessing ? 'Processing...' : 'Process Image'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {processingState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-800">{processingState.error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {processingState.result && (
        <div className="space-y-6">
          {/* Image Comparison */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Image Comparison</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Original</h3>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-64 object-contain border rounded-lg"
                  />
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    {processingState.result.metadata.original.width} ×{' '}
                    {processingState.result.metadata.original.height}
                  </p>
                  <p>
                    {formatFileSize(
                      processingState.result.metadata.original.fileSize
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Processed</h3>
                <img
                  src={processingState.result.processedImage}
                  alt="Processed"
                  className="w-full h-64 object-contain border rounded-lg"
                />
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    {processingState.result.metadata.processed.width} ×{' '}
                    {processingState.result.metadata.processed.height}
                  </p>
                  <p>
                    {formatFileSize(
                      processingState.result.metadata.processed.fileSize
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quality Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(processingState.result.qualityMetrics).map(
                ([key, value]) => {
                  if (key === 'overallScore') return null;
                  const score = typeof value === 'number' ? value : 0;
                  return (
                    <div key={key} className="text-center">
                      <div
                        className={`text-2xl font-bold ${getQualityColor(score)}`}
                      >
                        {(score * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Quality:</span>
                <span
                  className={`text-lg font-bold ${getQualityColor(processingState.result.qualityMetrics.overallScore)}`}
                >
                  {getQualityLabel(
                    processingState.result.qualityMetrics.overallScore
                  )}{' '}
                  (
                  {(
                    processingState.result.qualityMetrics.overallScore * 100
                  ).toFixed(0)}
                  %)
                </span>
              </div>
            </div>
          </div>

          {/* Processing Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Processing Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Transformations Applied</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {processingState.result.metadata.transformations.map(
                    (transform, index) => (
                      <li key={index}>• {transform}</li>
                    )
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Performance</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Total Time:{' '}
                    {processingState.result.performance.totalTime.toFixed(0)}ms
                  </p>
                  <p>
                    Memory Usage:{' '}
                    {processingState.result.performance.memoryUsage.toFixed(1)}
                    MB
                  </p>
                  <p>
                    Efficiency:{' '}
                    {(
                      processingState.result.performance.efficiency * 100
                    ).toFixed(0)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
