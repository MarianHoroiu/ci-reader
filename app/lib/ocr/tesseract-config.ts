/**
 * Tesseract.js configuration and initialization
 * Optimized for Romanian ID document processing
 */

import type {
  TesseractWorkerConfig,
  OCREngineConfig,
  OCRError,
} from './ocr-types';
import {
  DEFAULT_LANGUAGE_PACK,
  FALLBACK_LANGUAGE_PACK,
  TESSDATA_PATH,
} from './language-packs';
import { ROMANIAN_ID_CHAR_WHITELIST } from '../constants/romanian-characters';

// Tesseract.js local paths (to avoid CSP issues)
export const TESSERACT_CORE_PATH = '/workers/tesseract/tesseract-core.wasm.js';
export const TESSERACT_WORKER_PATH = '/workers/tesseract/worker.min.js';

// OCR Engine Modes (OEM)
export const OCR_ENGINE_MODES = {
  LEGACY_ONLY: 0, // Legacy engine only
  NEURAL_NETS_LSTM_ONLY: 1, // Neural nets LSTM engine only
  LEGACY_PLUS_LSTM: 2, // Legacy + LSTM engines
  DEFAULT: 3, // Default, based on what is available
} as const;

// Page Segmentation Modes (PSM)
export const PAGE_SEGMENTATION_MODES = {
  OSD_ONLY: 0, // Orientation and script detection (OSD) only
  AUTO_OSD: 1, // Automatic page segmentation with OSD
  AUTO_ONLY: 2, // Automatic page segmentation, but no OSD, or OCR
  AUTO: 3, // Fully automatic page segmentation, but no OSD (default)
  SINGLE_COLUMN: 4, // Assume a single column of text of variable sizes
  SINGLE_UNIFORM_BLOCK: 5, // Assume a single uniform block of vertically aligned text
  SINGLE_UNIFORM_BLOCK_OSD: 6, // Assume a single uniform block, but allow OSD
  SINGLE_TEXT_LINE: 7, // Treat the image as a single text line
  SINGLE_WORD: 8, // Treat the image as a single word
  CIRCLE_WORD: 9, // Treat the image as a single word in a circle
  SINGLE_CHARACTER: 10, // Treat the image as a single character
  SPARSE_TEXT: 11, // Sparse text. Find as much text as possible in no particular order
  SPARSE_TEXT_OSD: 12, // Sparse text with OSD
  RAW_LINE: 13, // Raw line. Treat the image as a single text line, bypassing hacks
} as const;

// Default Tesseract worker configuration (enhanced for CSP compliance)
export const DEFAULT_WORKER_CONFIG: TesseractWorkerConfig = {
  langPath: TESSDATA_PATH,
  gzip: false,
  // Note: logger and errorHandler are handled in the worker itself
  corePath: TESSERACT_CORE_PATH,
  workerPath: TESSERACT_WORKER_PATH,
};

// Default OCR engine configuration for Romanian ID documents (enhanced)
export const DEFAULT_OCR_CONFIG: OCREngineConfig = {
  languages: [DEFAULT_LANGUAGE_PACK],
  oem: OCR_ENGINE_MODES.NEURAL_NETS_LSTM_ONLY,
  psm: PAGE_SEGMENTATION_MODES.AUTO,
  tesseditCharWhitelist: ROMANIAN_ID_CHAR_WHITELIST,
  preserveInterwordSpaces: true,
};

// Romanian-specific OCR configuration
export const ROMANIAN_OCR_CONFIG: OCREngineConfig = {
  languages: ['ron'],
  oem: OCR_ENGINE_MODES.NEURAL_NETS_LSTM_ONLY,
  psm: PAGE_SEGMENTATION_MODES.AUTO,
  tesseditCharWhitelist: ROMANIAN_ID_CHAR_WHITELIST,
  preserveInterwordSpaces: true,
};

// Multi-language configuration for better accuracy
export const MULTILANG_OCR_CONFIG: OCREngineConfig = {
  languages: ['ron', 'eng'],
  oem: OCR_ENGINE_MODES.NEURAL_NETS_LSTM_ONLY,
  psm: PAGE_SEGMENTATION_MODES.AUTO,
  tesseditCharWhitelist: ROMANIAN_ID_CHAR_WHITELIST,
  preserveInterwordSpaces: true,
};

// Fallback configuration using English
export const FALLBACK_OCR_CONFIG: OCREngineConfig = {
  languages: [FALLBACK_LANGUAGE_PACK],
  oem: OCR_ENGINE_MODES.NEURAL_NETS_LSTM_ONLY,
  psm: PAGE_SEGMENTATION_MODES.AUTO,
  preserveInterwordSpaces: true,
};

/**
 * Tesseract configuration manager
 */
export class TesseractConfigManager {
  private static instance: TesseractConfigManager;
  private workerConfig: TesseractWorkerConfig;
  private ocrConfig: OCREngineConfig;

  private constructor() {
    this.workerConfig = { ...DEFAULT_WORKER_CONFIG };
    this.ocrConfig = { ...DEFAULT_OCR_CONFIG };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TesseractConfigManager {
    if (!TesseractConfigManager.instance) {
      TesseractConfigManager.instance = new TesseractConfigManager();
    }
    return TesseractConfigManager.instance;
  }

  /**
   * Get current worker configuration
   */
  getWorkerConfig(): TesseractWorkerConfig {
    return { ...this.workerConfig };
  }

  /**
   * Get current OCR configuration
   */
  getOCRConfig(): OCREngineConfig {
    return { ...this.ocrConfig };
  }

  /**
   * Update worker configuration
   */
  updateWorkerConfig(config: Partial<TesseractWorkerConfig>): void {
    this.workerConfig = { ...this.workerConfig, ...config };
  }

  /**
   * Update OCR configuration
   */
  updateOCRConfig(config: Partial<OCREngineConfig>): void {
    this.ocrConfig = { ...this.ocrConfig, ...config };
  }

  /**
   * Set language configuration
   */
  setLanguage(language: string | string[]): void {
    const languages = Array.isArray(language) ? language : [language];
    this.ocrConfig.languages = languages;
  }

  /**
   * Set page segmentation mode
   */
  setPageSegmentationMode(psm: number): void {
    this.ocrConfig.psm = psm;
  }

  /**
   * Set OCR engine mode
   */
  setOCREngineMode(oem: number): void {
    this.ocrConfig.oem = oem;
  }

  /**
   * Enable Romanian-specific configuration
   */
  enableRomanianMode(): void {
    this.ocrConfig = { ...ROMANIAN_OCR_CONFIG };
  }

  /**
   * Enable multi-language mode (Romanian + English)
   */
  enableMultiLanguageMode(): void {
    this.ocrConfig = { ...MULTILANG_OCR_CONFIG };
  }

  /**
   * Enable fallback mode (English only)
   */
  enableFallbackMode(): void {
    this.ocrConfig = { ...FALLBACK_OCR_CONFIG };
  }

  /**
   * Set character whitelist
   */
  setCharacterWhitelist(whitelist: string): void {
    this.ocrConfig.tesseditCharWhitelist = whitelist;
  }

  /**
   * Set character blacklist
   */
  setCharacterBlacklist(blacklist: string): void {
    this.ocrConfig.tesseditCharBlacklist = blacklist;
  }

  /**
   * Enable/disable interword space preservation
   */
  setPreserveInterwordSpaces(preserve: boolean): void {
    this.ocrConfig.preserveInterwordSpaces = preserve;
  }

  /**
   * Get optimized configuration for Romanian ID documents
   */
  getIDDocumentConfig(): OCREngineConfig {
    return {
      ...ROMANIAN_OCR_CONFIG,
      psm: PAGE_SEGMENTATION_MODES.AUTO,
      oem: OCR_ENGINE_MODES.NEURAL_NETS_LSTM_ONLY,
      tesseditCharWhitelist: ROMANIAN_ID_CHAR_WHITELIST,
      preserveInterwordSpaces: true,
    };
  }

  /**
   * Get configuration for single text line (e.g., names, addresses)
   */
  getSingleLineConfig(): OCREngineConfig {
    return {
      ...this.ocrConfig,
      psm: PAGE_SEGMENTATION_MODES.SINGLE_TEXT_LINE,
    };
  }

  /**
   * Get configuration for single word (e.g., series, numbers)
   */
  getSingleWordConfig(): OCREngineConfig {
    return {
      ...this.ocrConfig,
      psm: PAGE_SEGMENTATION_MODES.SINGLE_WORD,
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(): { isValid: boolean; errors: OCRError[] } {
    const errors: OCRError[] = [];

    // Validate languages
    if (!this.ocrConfig.languages || this.ocrConfig.languages.length === 0) {
      errors.push({
        code: 'INVALID_LANGUAGE',
        message: 'At least one language must be specified',
        recoverable: true,
        timestamp: new Date(),
      });
    }

    // Validate PSM
    const validPSM = Object.values(PAGE_SEGMENTATION_MODES) as number[];
    if (!validPSM.includes(this.ocrConfig.psm)) {
      errors.push({
        code: 'INVALID_PSM',
        message: `Invalid page segmentation mode: ${this.ocrConfig.psm}`,
        recoverable: true,
        timestamp: new Date(),
      });
    }

    // Validate OEM
    const validOEM = Object.values(OCR_ENGINE_MODES) as number[];
    if (!validOEM.includes(this.ocrConfig.oem)) {
      errors.push({
        code: 'INVALID_OEM',
        message: `Invalid OCR engine mode: ${this.ocrConfig.oem}`,
        recoverable: true,
        timestamp: new Date(),
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.workerConfig = { ...DEFAULT_WORKER_CONFIG };
    this.ocrConfig = { ...DEFAULT_OCR_CONFIG };
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(
      {
        worker: this.workerConfig,
        ocr: this.ocrConfig,
      },
      null,
      2
    );
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);

      if (config.worker) {
        this.updateWorkerConfig(config.worker);
      }

      if (config.ocr) {
        this.updateOCRConfig(config.ocr);
      }

      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const tesseractConfig = TesseractConfigManager.getInstance();
