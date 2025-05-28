/**
 * OCR Engine wrapper for Tesseract.js
 * Provides a clean API for Romanian ID document text extraction
 */

import type {
  OCRResult,
  OCRProgress,
  OCRError,
  OCRProcessingOptions,
  OCREngineStatus,
  OCRWorkerInstance,
  PreprocessingResult,
} from './ocr-types';
import { tesseractConfig } from './tesseract-config';
import { languagePackManager, DEFAULT_LANGUAGE_PACK } from './language-packs';
import {
  correctRomanianText,
  isValidRomanianText,
} from '../constants/romanian-characters';
import { ocrWorkerManager } from '../workers/ocr-worker-manager';
import { checkWorkerCompatibility } from '../workers/worker-utils';

// Dynamic import for Tesseract.js to avoid SSR issues
let TesseractModule: typeof import('tesseract.js') | null = null;

/**
 * Main OCR Engine class
 */
export class OCREngine {
  private static instance: OCREngine;
  private workers: Map<string, OCRWorkerInstance> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private status: OCREngineStatus = {
    isInitialized: false,
    isProcessing: false,
    currentLanguage: DEFAULT_LANGUAGE_PACK,
    availableLanguages: [],
    workerCount: 0,
    memoryUsage: 0,
  };

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OCREngine {
    if (!OCREngine.instance) {
      OCREngine.instance = new OCREngine();
    }
    return OCREngine.instance;
  }

  /**
   * Initialize the OCR engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  /**
   * Internal initialization implementation
   */
  private async _performInitialization(): Promise<void> {
    try {
      // Dynamic import of Tesseract.js
      if (!TesseractModule) {
        TesseractModule = await import('tesseract.js');
      }

      // Load language pack configuration
      languagePackManager.loadLanguagePacksConfig();

      // Ensure Romanian language pack is available
      const isRomanianAvailable =
        await languagePackManager.isLanguagePackAvailable('ron');
      if (!isRomanianAvailable) {
        console.log('Romanian language pack not found, downloading...');
        await languagePackManager.downloadLanguagePack('ron', progress => {
          console.log(
            `Downloading Romanian language pack: ${progress.percentage.toFixed(1)}%`
          );
        });
      }

      // Update status
      this.status = {
        ...this.status,
        isInitialized: true,
        availableLanguages: languagePackManager
          .getAvailableLanguagePacks()
          .map(pack => pack.code),
      };

      this.isInitialized = true;
      console.log('OCR Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR engine:', error);
      this.status.lastError = {
        code: 'INITIALIZATION_FAILED',
        message: 'Failed to initialize OCR engine',
        details: error instanceof Error ? error.message : String(error),
        recoverable: true,
        timestamp: new Date(),
      };
      throw error;
    }
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(language: string): Promise<OCRWorkerInstance> {
    if (!TesseractModule) {
      throw new Error('Tesseract module not loaded');
    }

    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workerConfig = tesseractConfig.getWorkerConfig();

    try {
      // Filter out undefined values to satisfy strict type checking
      const config: any = {
        langPath: workerConfig.langPath,
        gzip: workerConfig.gzip,
      };

      if (workerConfig.logger) config.logger = workerConfig.logger;
      if (workerConfig.errorHandler)
        config.errorHandler = workerConfig.errorHandler;
      if (workerConfig.corePath) config.corePath = workerConfig.corePath;
      if (workerConfig.workerPath) config.workerPath = workerConfig.workerPath;

      const worker = await TesseractModule.createWorker(language, 1, config);

      const workerInstance: OCRWorkerInstance = {
        worker,
        id: workerId,
        isReady: true,
        isBusy: false,
        language,
        createdAt: new Date(),
        lastUsed: new Date(),
      };

      this.workers.set(workerId, workerInstance);
      this.status.workerCount = this.workers.size;

      console.log(`Created OCR worker ${workerId} for language: ${language}`);
      return workerInstance;
    } catch (error) {
      console.error(`Failed to create worker for language ${language}:`, error);
      throw error;
    }
  }

  /**
   * Get or create a worker for the specified language
   */
  private async getWorker(language: string): Promise<OCRWorkerInstance> {
    // Find existing worker for this language
    for (const worker of this.workers.values()) {
      if (worker.language === language && !worker.isBusy && worker.isReady) {
        worker.lastUsed = new Date();
        return worker;
      }
    }

    // Create new worker if none available
    return this.createWorker(language);
  }

  /**
   * Process image with OCR using workers when available
   */
  async processImageWithWorkers(
    imageInput: string | File | ImageData | HTMLCanvasElement,
    options: OCRProcessingOptions = { language: DEFAULT_LANGUAGE_PACK },
    onProgress?: (_progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const compatibility = checkWorkerCompatibility();

    if (compatibility.isSupported) {
      // Use worker-based processing
      return new Promise((resolve, reject) => {
        ocrWorkerManager.processImage(
          imageInput,
          options,
          onProgress,
          result => resolve(result),
          error => reject(error)
        );
      });
    } else {
      // Fallback to main thread processing
      return this.processImage(imageInput, options);
    }
  }

  /**
   * Process image with OCR (main thread)
   */
  async processImage(
    imageInput: string | File | ImageData | HTMLCanvasElement,
    options: OCRProcessingOptions = { language: DEFAULT_LANGUAGE_PACK }
  ): Promise<OCRResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.status.isProcessing = true;

    try {
      // Preprocess image if requested
      let processedImage = imageInput;
      if (options.preprocessImage) {
        const preprocessResult = await this.preprocessImage(
          imageInput,
          options
        );
        processedImage = preprocessResult.processedImage;
      }

      // Get worker for the specified language
      const worker = await this.getWorker(options.language);
      worker.isBusy = true;

      // Configure OCR parameters
      const ocrConfig = tesseractConfig.getOCRConfig();
      await worker.worker.setParameters({
        tessedit_pageseg_mode: ocrConfig.psm,
        tessedit_ocr_engine_mode: ocrConfig.oem,
        tessedit_char_whitelist: ocrConfig.tesseditCharWhitelist || '',
        tessedit_char_blacklist: ocrConfig.tesseditCharBlacklist || '',
        preserve_interword_spaces: ocrConfig.preserveInterwordSpaces
          ? '1'
          : '0',
      });

      // Perform OCR recognition
      const result = await worker.worker.recognize(processedImage, {
        logger: (info: any) => {
          const progress: OCRProgress = {
            status: this.mapTesseractStatus(info.status),
            progress: info.progress * 100,
            message: info.status,
            stage: info.status,
          };
          options.onProgress?.(progress);
        },
      });

      // Process and correct the extracted text
      let correctedText = result.data.text;
      if (options.language === 'ron' || options.language.includes('ron')) {
        correctedText = correctRomanianText(correctedText);
      }

      // Build OCR result
      const ocrResult: OCRResult = {
        text: correctedText,
        confidence: result.data.confidence,
        words: this.mapWords(result.data.words),
        lines: this.mapLines(result.data.lines),
        paragraphs: this.mapParagraphs(result.data.paragraphs),
        blocks: this.mapBlocks(result.data.blocks),
        bbox: this.mapBoundingBox(result.data.bbox),
        processingTime: Date.now() - startTime,
        language: options.language,
      };

      // Validate result if Romanian
      if (options.language === 'ron' && !isValidRomanianText(ocrResult.text)) {
        console.warn('OCR result contains invalid Romanian characters');
      }

      // Release worker
      worker.isBusy = false;
      worker.lastUsed = new Date();

      return ocrResult;
    } catch (error) {
      console.error('OCR processing failed:', error);
      const ocrError: OCRError = {
        code: 'OCR_PROCESSING_FAILED',
        message: 'Failed to process image with OCR',
        details: error instanceof Error ? error.message : String(error),
        recoverable: true,
        timestamp: new Date(),
      };

      this.status.lastError = ocrError;
      options.onError?.(ocrError);
      throw error;
    } finally {
      this.status.isProcessing = false;
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(
    imageInput: string | File | ImageData | HTMLCanvasElement,
    options: OCRProcessingOptions
  ): Promise<PreprocessingResult> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Load image into canvas
      let img: HTMLImageElement;
      if (typeof imageInput === 'string') {
        img = new Image();
        img.src = imageInput;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else if (imageInput instanceof File) {
        img = new Image();
        img.src = URL.createObjectURL(imageInput);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else {
        // Handle ImageData or HTMLCanvasElement
        return {
          processedImage: imageInput as ImageData | HTMLCanvasElement,
          operations: ['no_preprocessing'],
          qualityScore: 1.0,
          processingTime: Date.now() - startTime,
        };
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Apply preprocessing operations
      if (options.convertToGrayscale) {
        this.convertToGrayscale(ctx, canvas.width, canvas.height);
        operations.push('grayscale');
      }

      if (options.enhanceContrast) {
        this.enhanceContrast(ctx, canvas.width, canvas.height);
        operations.push('contrast_enhancement');
      }

      if (options.removeNoise) {
        this.removeNoise(ctx, canvas.width, canvas.height);
        operations.push('noise_removal');
      }

      // Calculate quality score (simplified)
      const qualityScore = this.calculateImageQuality(
        ctx,
        canvas.width,
        canvas.height
      );

      return {
        processedImage: canvas,
        operations,
        qualityScore,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return {
        processedImage: imageInput,
        operations: ['preprocessing_failed'],
        qualityScore: 0.5,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Convert image to grayscale
   */
  private convertToGrayscale(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(
        0.299 * (data[i] || 0) +
          0.587 * (data[i + 1] || 0) +
          0.114 * (data[i + 2] || 0)
      );
      data[i] = gray; // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Enhance image contrast
   */
  private enhanceContrast(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const factor = 1.5; // Contrast enhancement factor

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(
        255,
        Math.max(0, factor * ((data[i] || 0) - 128) + 128)
      ); // Red
      data[i + 1] = Math.min(
        255,
        Math.max(0, factor * ((data[i + 1] || 0) - 128) + 128)
      ); // Green
      data[i + 2] = Math.min(
        255,
        Math.max(0, factor * ((data[i + 2] || 0) - 128) + 128)
      ); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Remove noise from image
   */
  private removeNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    // Simple median filter for noise removal
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          // RGB channels
          const pixels = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              pixels.push(data[idx]);
            }
          }
          pixels.sort((a, b) => (a || 0) - (b || 0));
          const idx = (y * width + x) * 4 + c;
          newData[idx] = pixels[4] || 0; // Median value
        }
      }
    }

    const newImageData = new ImageData(newData, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }

  /**
   * Calculate image quality score
   */
  private calculateImageQuality(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): number {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let totalVariance = 0;
    let pixelCount = 0;

    // Calculate variance as a measure of image quality
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        0.299 * (data[i] || 0) +
        0.587 * (data[i + 1] || 0) +
        0.114 * (data[i + 2] || 0);
      totalVariance += gray * gray;
      pixelCount++;
    }

    const variance = totalVariance / pixelCount;
    return Math.min(1.0, variance / 10000); // Normalize to 0-1 range
  }

  /**
   * Map Tesseract status to OCR progress status
   */
  private mapTesseractStatus(status: string): OCRProgress['status'] {
    switch (status) {
      case 'loading tesseract core':
      case 'initializing tesseract':
        return 'initializing';
      case 'loading language traineddata':
        return 'loading';
      case 'recognizing text':
        return 'recognizing';
      case 'done':
        return 'completed';
      default:
        return 'recognizing';
    }
  }

  /**
   * Map Tesseract words to OCR words
   */
  private mapWords(words: any[]): any[] {
    return words.map(word => ({
      text: word.text,
      confidence: word.confidence,
      bbox: this.mapBoundingBox(word.bbox),
      baseline: word.baseline,
      fontSize: word.font_size || 0,
      fontName: word.font_name || '',
      bold: word.bold || false,
      italic: word.italic || false,
    }));
  }

  /**
   * Map Tesseract lines to OCR lines
   */
  private mapLines(lines: any[]): any[] {
    return lines.map(line => ({
      text: line.text,
      confidence: line.confidence,
      bbox: this.mapBoundingBox(line.bbox),
      baseline: line.baseline,
      words: this.mapWords(line.words || []),
    }));
  }

  /**
   * Map Tesseract paragraphs to OCR paragraphs
   */
  private mapParagraphs(paragraphs: any[]): any[] {
    return paragraphs.map(paragraph => ({
      text: paragraph.text,
      confidence: paragraph.confidence,
      bbox: this.mapBoundingBox(paragraph.bbox),
      lines: this.mapLines(paragraph.lines || []),
    }));
  }

  /**
   * Map Tesseract blocks to OCR blocks
   */
  private mapBlocks(blocks: any[]): any[] {
    return blocks.map(block => ({
      text: block.text,
      confidence: block.confidence,
      bbox: this.mapBoundingBox(block.bbox),
      paragraphs: this.mapParagraphs(block.paragraphs || []),
    }));
  }

  /**
   * Map Tesseract bounding box to OCR bounding box
   */
  private mapBoundingBox(bbox: any): any {
    return {
      x0: bbox.x0 || 0,
      y0: bbox.y0 || 0,
      x1: bbox.x1 || 0,
      y1: bbox.y1 || 0,
    };
  }

  /**
   * Get current engine status
   */
  getStatus(): OCREngineStatus {
    return { ...this.status };
  }

  /**
   * Terminate a specific worker
   */
  async terminateWorker(workerId: string): Promise<boolean> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return false;
    }

    try {
      await worker.worker.terminate();
      this.workers.delete(workerId);
      this.status.workerCount = this.workers.size;
      console.log(`Terminated OCR worker ${workerId}`);
      return true;
    } catch (error) {
      console.error(`Failed to terminate worker ${workerId}:`, error);
      return false;
    }
  }

  /**
   * Terminate all workers and cleanup
   */
  async cleanup(): Promise<void> {
    const terminationPromises = Array.from(this.workers.keys()).map(workerId =>
      this.terminateWorker(workerId)
    );

    await Promise.all(terminationPromises);

    this.workers.clear();
    this.isInitialized = false;
    this.initializationPromise = null;
    this.status = {
      isInitialized: false,
      isProcessing: false,
      currentLanguage: DEFAULT_LANGUAGE_PACK,
      availableLanguages: [],
      workerCount: 0,
      memoryUsage: 0,
    };

    console.log('OCR Engine cleanup completed');
  }
}

// Export singleton instance
export const ocrEngine = OCREngine.getInstance();
