/**
 * Image Processing Types for Romanian ID Extraction
 * Optimized for Qwen2.5-VL-7B-Instruct model input
 */

export interface ImageProcessingOptions {
  /** Target width for processed image (default: 1024) */
  targetWidth?: number;
  /** Target height for processed image (default: 768) */
  targetHeight?: number;
  /** JPEG quality (0-1, default: 0.9) */
  quality?: number;
  /** Enable automatic rotation correction */
  autoRotate?: boolean;
  /** Enable image quality enhancement */
  enhanceQuality?: boolean;
  /** Enable noise reduction */
  reduceNoise?: boolean;
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Preserve aspect ratio */
  preserveAspectRatio?: boolean;
}

export interface ImageQualityMetrics {
  /** Overall quality score (0-1) */
  overallScore: number;
  /** Sharpness score (0-1) */
  sharpness: number;
  /** Contrast score (0-1) */
  contrast: number;
  /** Brightness score (0-1) */
  brightness: number;
  /** Noise level (0-1, lower is better) */
  noiseLevel: number;
  /** Resolution adequacy (0-1) */
  resolution: number;
  /** Color balance score (0-1) */
  colorBalance: number;
}

export interface RotationDetectionResult {
  /** Detected rotation angle in degrees */
  angle: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether rotation correction is recommended */
  shouldCorrect: boolean;
  /** Detected orientation (portrait/landscape) */
  orientation: 'portrait' | 'landscape';
}

export interface ImageValidationResult {
  /** Whether the image is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Image metadata */
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  /** Original width */
  width: number;
  /** Original height */
  height: number;
  /** File size in bytes */
  fileSize: number;
  /** Image format */
  format: string;
  /** Color depth */
  colorDepth: number;
  /** Has transparency */
  hasAlpha: boolean;
  /** Aspect ratio */
  aspectRatio: number;
}

export interface ProcessingResult {
  /** Processed image as base64 data URL */
  processedImage: string;
  /** Processing metadata */
  metadata: ProcessingMetadata;
  /** Quality metrics of processed image */
  qualityMetrics: ImageQualityMetrics;
  /** Processing performance metrics */
  performance: PerformanceMetrics;
}

export interface ProcessingMetadata {
  /** Original image metadata */
  original: ImageMetadata;
  /** Processed image metadata */
  processed: ImageMetadata;
  /** Applied transformations */
  transformations: string[];
  /** Processing options used */
  options: ImageProcessingOptions;
  /** Rotation correction applied */
  rotationCorrection?: RotationDetectionResult;
}

export interface PerformanceMetrics {
  /** Total processing time in milliseconds */
  totalTime: number;
  /** Time breakdown by operation */
  operationTimes: Record<string, number>;
  /** Memory usage peak in MB */
  memoryUsage: number;
  /** Processing efficiency score (0-1) */
  efficiency: number;
}

export interface QwenOptimalSpecs {
  /** Recommended image width */
  width: number;
  /** Recommended image height */
  height: number;
  /** Recommended format */
  format: 'jpeg' | 'png';
  /** Recommended quality */
  quality: number;
  /** Maximum file size */
  maxSize: number;
  /** Color space */
  colorSpace: 'sRGB' | 'RGB';
}

export interface RomanianIDLayoutSpecs {
  /** Expected aspect ratio */
  aspectRatio: number;
  /** Minimum width for text recognition */
  minWidth: number;
  /** Minimum height for text recognition */
  minHeight: number;
  /** Expected orientation */
  orientation: 'landscape';
  /** Text regions for quality assessment */
  textRegions: Array<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export type SupportedImageFormat =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/heic';

export interface FormatConversionOptions {
  /** Target format */
  targetFormat: SupportedImageFormat;
  /** Conversion quality (0-1) */
  quality?: number;
  /** Preserve metadata */
  preserveMetadata?: boolean;
}

export interface ImageProcessingError extends Error {
  code: string;
  details?: any;
  recoverable: boolean;
}

export interface ProcessingPipelineConfig {
  /** Qwen model optimal specifications */
  qwenSpecs: QwenOptimalSpecs;
  /** Romanian ID layout specifications */
  idLayoutSpecs: RomanianIDLayoutSpecs;
  /** Default processing options */
  defaultOptions: ImageProcessingOptions;
  /** Performance thresholds */
  performanceThresholds: {
    maxProcessingTime: number;
    maxMemoryUsage: number;
    minQualityScore: number;
  };
}
