/**
 * Image preprocessing module for OCR optimization
 * Provides comprehensive image enhancement for better text recognition
 */

// Main pipeline exports
export {
  PreprocessingPipeline,
  preprocessImage,
  preprocessRomanianID,
} from './preprocessing-pipeline';

// Type definitions
export type {
  ImageInput,
  ImageOutput,
  ImageFormat,
  PreprocessingOperation,
  PreprocessingConfig,
  PreprocessingResult,
  PreprocessingProgress,
  PreprocessingPipelineOptions,
  ImageQualityMetrics,
  ImageAnalysisResult,
  CanvasProcessingContext,
  PreprocessingCompatibility,
} from './types/preprocessing-types';

// Configuration presets
export {
  DEFAULT_PREPROCESSING_CONFIG,
  ROMANIAN_ID_PREPROCESSING_CONFIG,
} from './types/preprocessing-types';

// Individual filter functions
export {
  applyGrayscaleConversion,
  isGrayscale,
  getOptimalGrayscaleMethod,
} from './filters/grayscale-conversion';

export {
  applyContrastEnhancement,
  calculateOptimalContrastFactor,
  needsContrastEnhancement,
  applyHistogramStretching,
} from './filters/contrast-enhancement';

export {
  applyNoiseReduction,
  applyMorphologicalOpening,
  applyMorphologicalClosing,
  detectOptimalNoiseReductionMethod,
} from './filters/noise-reduction';

export {
  applyRotationCorrection,
  detectRotationByHoughTransform,
  needsRotationCorrection,
  getOptimalRotationMethod,
} from './filters/rotation-correction';

// Utility functions
export {
  createCanvasContext,
  canvasToOutput,
  checkCanvasCompatibility,
  getImageStatistics,
  calculateHistogram,
  applyConvolution,
  createKernel,
} from './utils/canvas-utils';

export {
  analyzeImage,
  calculateQualityMetrics,
  calculateSharpness,
  calculateContrast,
  calculateBrightness,
  calculateNoise,
  calculateTextReadability,
  detectDocumentImage,
  detectRotation,
  recommendPreprocessingOperations,
  calculateSuitabilityScore,
} from './utils/image-analysis';
