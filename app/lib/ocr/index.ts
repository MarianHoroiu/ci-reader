/**
 * OCR Module Exports
 * Provides a clean API for Romanian ID document OCR processing
 */

// Core OCR functionality
export { ocrEngine, OCREngine } from './ocr-engine';
export { tesseractConfig, TesseractConfigManager } from './tesseract-config';
export { languagePackManager, LanguagePackManager } from './language-packs';

// Text processing utilities
export {
  cleanOCRText,
  validateRomanianText,
  extractIDFields,
  calculateTextConfidence,
  enhanceOCRText,
  splitIDDocumentText,
  extractCNPInfo,
} from './text-processing';

// Import for internal use
import { ocrEngine } from './ocr-engine';
import { tesseractConfig } from './tesseract-config';
import { languagePackManager } from './language-packs';
import {
  extractIDFields,
  calculateTextConfidence,
  extractCNPInfo,
} from './text-processing';
import type {
  OCRResult,
  OCRProcessingOptions,
  OCREngineStatus,
} from './ocr-types';

// Type definitions
export type {
  OCRResult,
  OCRProgress,
  OCRError,
  OCRProcessingOptions,
  OCREngineStatus,
  OCRWorkerInstance,
  PreprocessingResult,
  LanguagePackConfig,
  LanguagePackDownloadProgress,
  TesseractWorkerConfig,
  OCREngineConfig,
  RomanianIDField,
  RomanianIDResult,
  RomanianCharacterValidation,
  LoggerMessage,
  BoundingBox,
  Baseline,
  OCRWord,
  OCRLine,
  OCRParagraph,
  OCRBlock,
} from './ocr-types';

// Constants and configuration
export {
  DEFAULT_LANGUAGE_PACK,
  FALLBACK_LANGUAGE_PACK,
  AVAILABLE_LANGUAGE_PACKS,
  TESSDATA_PATH,
} from './language-packs';

export {
  OCR_ENGINE_MODES,
  PAGE_SEGMENTATION_MODES,
  DEFAULT_WORKER_CONFIG,
  DEFAULT_OCR_CONFIG,
  ROMANIAN_OCR_CONFIG,
  MULTILANG_OCR_CONFIG,
  FALLBACK_OCR_CONFIG,
} from './tesseract-config';

// Romanian character constants
export {
  ROMANIAN_SPECIAL_CHARS,
  ROMANIAN_SPECIAL_CHARS_ARRAY,
  ROMANIAN_ALPHABET,
  ROMANIAN_CHAR_SUBSTITUTIONS,
  ROMANIAN_ID_CHAR_WHITELIST,
  ROMANIAN_ID_KEYWORDS,
  ROMANIAN_COUNTIES,
  isValidRomanianText,
  correctRomanianText,
  extractRomanianChars,
  isValidCountyCode,
  getCountyName,
  isValidCNP,
  parseCNP,
} from '../constants/romanian-characters';

/**
 * Initialize OCR engine with Romanian language support
 * This is the main entry point for OCR functionality
 */
export async function initializeOCR(): Promise<void> {
  try {
    console.log('Initializing OCR engine...');
    await ocrEngine.initialize();
    console.log('OCR engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OCR engine:', error);
    throw error;
  }
}

/**
 * Process Romanian ID document with OCR
 * Simplified API for common use cases
 */
export async function processRomanianID(
  imageInput: string | File | ImageData | HTMLCanvasElement,
  options: Partial<OCRProcessingOptions> = {}
): Promise<OCRResult> {
  const defaultOptions: OCRProcessingOptions = {
    language: 'ron',
    preprocessImage: true,
    enhanceContrast: true,
    removeNoise: true,
    convertToGrayscale: true,
    confidenceThreshold: 0.7,
    ...options,
  };

  return ocrEngine.processImage(imageInput, defaultOptions);
}

/**
 * Extract structured data from Romanian ID document
 */
export async function extractRomanianIDData(
  imageInput: string | File | ImageData | HTMLCanvasElement,
  options: Partial<OCRProcessingOptions> = {}
): Promise<{
  ocrResult: OCRResult;
  extractedFields: Record<string, string>;
  cnpInfo: ReturnType<typeof extractCNPInfo>;
  confidence: number;
}> {
  // Process image with OCR
  const ocrResult = await processRomanianID(imageInput, options);

  // Extract structured fields
  const extractedFields = extractIDFields(ocrResult.text);

  // Extract and validate CNP
  const cnpInfo = extractCNPInfo(ocrResult.text);

  // Calculate overall confidence
  const confidence = calculateTextConfidence(
    ocrResult.text,
    ocrResult.confidence,
    'ron'
  );

  return {
    ocrResult,
    extractedFields,
    cnpInfo,
    confidence,
  };
}

/**
 * Check if OCR engine is ready
 */
export function isOCRReady(): boolean {
  return ocrEngine.getStatus().isInitialized;
}

/**
 * Get OCR engine status
 */
export function getOCRStatus(): OCREngineStatus {
  return ocrEngine.getStatus();
}

/**
 * Cleanup OCR resources
 */
export async function cleanupOCR(): Promise<void> {
  await ocrEngine.cleanup();
}

// Default export for convenience
const ocrAPI = {
  initializeOCR,
  processRomanianID,
  extractRomanianIDData,
  isOCRReady,
  getOCRStatus,
  cleanupOCR,
  ocrEngine,
  tesseractConfig,
  languagePackManager,
};

export default ocrAPI;
