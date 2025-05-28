/**
 * TypeScript interfaces for image preprocessing pipeline
 * Defines types for image enhancement and analysis operations
 */

// Supported image input types
export type ImageInput =
  | string
  | File
  | ImageData
  | HTMLCanvasElement
  | HTMLImageElement;

// Supported image output types
export type ImageOutput = ImageData | HTMLCanvasElement | string;

// Image format types
export type ImageFormat = 'jpeg' | 'png' | 'webp';

// Preprocessing operation types
export type PreprocessingOperation =
  | 'grayscale'
  | 'contrast_enhancement'
  | 'brightness_adjustment'
  | 'noise_reduction'
  | 'rotation_correction'
  | 'gaussian_blur'
  | 'sharpening'
  | 'histogram_equalization'
  | 'adaptive_threshold'
  | 'morphological_operations';

// Image quality metrics
export interface ImageQualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  noise: number;
  overall: number;
  textReadability: number;
}

// Preprocessing configuration for each operation
export interface PreprocessingConfig {
  // Grayscale conversion
  grayscale?: {
    enabled: boolean;
    method?: 'luminance' | 'average' | 'desaturation';
    preserveAlpha?: boolean;
  };

  // Contrast enhancement
  contrast?: {
    enabled: boolean;
    factor?: number;
    adaptive?: boolean;
    clipLimit?: number;
  };

  // Brightness adjustment
  brightness?: {
    enabled: boolean;
    adjustment?: number;
    autoAdjust?: boolean;
  };

  // Noise reduction
  noiseReduction?: {
    enabled: boolean;
    method?: 'median' | 'gaussian' | 'bilateral';
    kernelSize?: number;
    strength?: number;
  };

  // Rotation correction
  rotationCorrection?: {
    enabled: boolean;
    maxAngle?: number;
    method?: 'hough' | 'projection' | 'edge_detection';
    precision?: number;
  };

  // Gaussian blur
  gaussianBlur?: {
    enabled: boolean;
    radius?: number;
    sigma?: number;
  };

  // Sharpening
  sharpening?: {
    enabled: boolean;
    method?: 'unsharp_mask' | 'laplacian' | 'high_pass';
    strength?: number;
    radius?: number;
  };

  // Histogram equalization
  histogramEqualization?: {
    enabled: boolean;
    adaptive?: boolean;
    clipLimit?: number;
    tileGridSize?: number;
  };

  // Adaptive thresholding
  adaptiveThreshold?: {
    enabled: boolean;
    method?: 'mean' | 'gaussian';
    blockSize?: number;
    constant?: number;
  };

  // Morphological operations
  morphological?: {
    enabled: boolean;
    operation?: 'opening' | 'closing' | 'erosion' | 'dilation';
    kernelSize?: number;
    iterations?: number;
  };
}

// Default preprocessing configuration
export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  grayscale: {
    enabled: true,
    method: 'luminance',
    preserveAlpha: true,
  },
  contrast: {
    enabled: true,
    factor: 1.2,
    adaptive: false,
    clipLimit: 2.0,
  },
  brightness: {
    enabled: false,
    adjustment: 0,
    autoAdjust: true,
  },
  noiseReduction: {
    enabled: true,
    method: 'median',
    kernelSize: 3,
    strength: 0.5,
  },
  rotationCorrection: {
    enabled: true,
    maxAngle: 15,
    method: 'hough',
    precision: 0.5,
  },
  gaussianBlur: {
    enabled: false,
    radius: 1,
    sigma: 0.5,
  },
  sharpening: {
    enabled: false,
    method: 'unsharp_mask',
    strength: 0.5,
    radius: 1,
  },
  histogramEqualization: {
    enabled: false,
    adaptive: true,
    clipLimit: 2.0,
    tileGridSize: 8,
  },
  adaptiveThreshold: {
    enabled: false,
    method: 'gaussian',
    blockSize: 11,
    constant: 2,
  },
  morphological: {
    enabled: false,
    operation: 'opening',
    kernelSize: 3,
    iterations: 1,
  },
};

// Romanian ID specific preprocessing configuration
export const ROMANIAN_ID_PREPROCESSING_CONFIG: PreprocessingConfig = {
  grayscale: {
    enabled: true,
    method: 'luminance',
    preserveAlpha: true,
  },
  contrast: {
    enabled: true,
    factor: 1.3,
    adaptive: true,
    clipLimit: 2.5,
  },
  brightness: {
    enabled: true,
    adjustment: 0,
    autoAdjust: true,
  },
  noiseReduction: {
    enabled: true,
    method: 'bilateral',
    kernelSize: 5,
    strength: 0.7,
  },
  rotationCorrection: {
    enabled: true,
    maxAngle: 10,
    method: 'hough',
    precision: 0.25,
  },
  sharpening: {
    enabled: true,
    method: 'unsharp_mask',
    strength: 0.3,
    radius: 1,
  },
};

// Preprocessing pipeline result
export interface PreprocessingResult {
  processedImage: ImageOutput;
  originalImage: ImageInput;
  operations: PreprocessingOperation[];
  qualityMetrics: ImageQualityMetrics;
  processingTime: number;
  rotationAngle?: number;
  config: PreprocessingConfig;
  success: boolean;
  errors?: string[];
}

// Preprocessing progress information
export interface PreprocessingProgress {
  stage: string;
  operation: PreprocessingOperation | 'initialization' | 'finalization';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

// Image analysis result
export interface ImageAnalysisResult {
  dimensions: {
    width: number;
    height: number;
  };
  format: ImageFormat;
  size: number;
  qualityMetrics: ImageQualityMetrics;
  isDocumentImage: boolean;
  detectedRotation: number;
  recommendedOperations: PreprocessingOperation[];
  suitabilityScore: number;
}

// Canvas processing context
export interface CanvasProcessingContext {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
  width: number;
  height: number;
}

// Filter function type
export type FilterFunction = (
  _context: CanvasProcessingContext,
  _config: any
) => Promise<void> | void;

// Preprocessing pipeline options
export interface PreprocessingPipelineOptions {
  config?: Partial<PreprocessingConfig>;
  onProgress?: (_progress: PreprocessingProgress) => void;
  onError?: (_error: Error) => void;
  outputFormat?: ImageFormat;
  outputQuality?: number;
  maxDimensions?: {
    width: number;
    height: number;
  };
  preserveAspectRatio?: boolean;
}

// Error types for preprocessing
export interface PreprocessingError extends Error {
  code:
    | 'INVALID_INPUT'
    | 'PROCESSING_FAILED'
    | 'CANVAS_ERROR'
    | 'MEMORY_ERROR'
    | 'TIMEOUT';
  operation?: PreprocessingOperation;
  details?: string;
}

// Browser compatibility information
export interface PreprocessingCompatibility {
  canvas2D: boolean;
  offscreenCanvas: boolean;
  imageData: boolean;
  webWorkers: boolean;
  supportedFormats: ImageFormat[];
  maxCanvasSize: number;
  features: string[];
  limitations: string[];
}
