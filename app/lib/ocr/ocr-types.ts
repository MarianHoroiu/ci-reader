/**
 * TypeScript interfaces for OCR operations
 * Defines types for Tesseract.js integration and Romanian ID processing
 */

// Note: Tesseract.js types will be available after npm install

// Language pack configuration
export interface LanguagePackConfig {
  code: string;
  name: string;
  url: string;
  size: number;
  version: string;
  isDownloaded: boolean;
}

// Tesseract worker configuration
export interface TesseractWorkerConfig {
  langPath: string;
  gzip: boolean;
  logger?: (_info: LoggerMessage) => void;
  errorHandler?: (_error: Error) => void;
  corePath?: string;
  workerPath?: string;
}

// OCR engine configuration
export interface OCREngineConfig {
  languages: string[];
  oem: number; // OCR Engine Mode
  psm: number; // Page Segmentation Mode
  tesseditCharWhitelist?: string;
  tesseditCharBlacklist?: string;
  preserveInterwordSpaces?: boolean;
  userWordsFile?: string;
  userPatternsFile?: string;
}

// OCR recognition result
export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
  lines: OCRLine[];
  paragraphs: OCRParagraph[];
  blocks: OCRBlock[];
  bbox: BoundingBox;
  processingTime: number;
  language: string;
}

// Word-level OCR result
export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  baseline: Baseline;
  fontSize: number;
  fontName: string;
  bold: boolean;
  italic: boolean;
}

// Line-level OCR result
export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  baseline: Baseline;
  words: OCRWord[];
}

// Paragraph-level OCR result
export interface OCRParagraph {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  lines: OCRLine[];
}

// Block-level OCR result
export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  paragraphs: OCRParagraph[];
}

// Bounding box coordinates
export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Text baseline information
export interface Baseline {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  hasBaseline: boolean;
}

// Logger message from Tesseract
export interface LoggerMessage {
  workerId: string;
  jobId: string;
  status: string;
  progress: number;
  userJobId: string;
}

// OCR processing progress
export interface OCRProgress {
  status: 'initializing' | 'loading' | 'recognizing' | 'completed' | 'error';
  progress: number;
  message: string;
  stage: string;
  estimatedTimeRemaining?: number;
}

// OCR processing options
export interface OCRProcessingOptions {
  language: string;
  preprocessImage?: boolean;
  enhanceContrast?: boolean;
  removeNoise?: boolean;
  correctRotation?: boolean;
  convertToGrayscale?: boolean;
  confidenceThreshold?: number;
  onProgress?: (_progress: OCRProgress) => void;
  onError?: (_error: OCRError) => void;
}

// OCR error types
export interface OCRError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  timestamp: Date;
}

// Romanian ID field extraction result
export interface RomanianIDField {
  fieldName: string;
  value: string;
  confidence: number;
  bbox: BoundingBox;
  isValid: boolean;
  validationErrors?: string[];
}

// Complete Romanian ID extraction result
export interface RomanianIDResult {
  fields: Record<string, RomanianIDField>;
  overallConfidence: number;
  processingTime: number;
  imageQuality: number;
  extractionSuccess: boolean;
  errors: OCRError[];
}

// Language pack download progress
export interface LanguagePackDownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  estimatedTimeRemaining: number;
}

// OCR engine status
export interface OCREngineStatus {
  isInitialized: boolean;
  isProcessing: boolean;
  currentLanguage: string;
  availableLanguages: string[];
  workerCount: number;
  memoryUsage: number;
  lastError?: OCRError;
}

// Image preprocessing result
export interface PreprocessingResult {
  processedImage: ImageData | HTMLCanvasElement | string | File;
  operations: string[];
  qualityScore: number;
  processingTime: number;
}

// OCR worker instance wrapper
export interface OCRWorkerInstance {
  worker: any; // Will be typed as Tesseract.Worker after installation
  id: string;
  isReady: boolean;
  isBusy: boolean;
  language: string;
  createdAt: Date;
  lastUsed: Date;
}

// Romanian character validation
export interface RomanianCharacterValidation {
  isValid: boolean;
  invalidCharacters: string[];
  suggestions: string[];
  confidence: number;
}
