/**
 * Dynamic Worker Manager for Tesseract.js
 * Creates workers using blob URLs to avoid path issues
 * Based on proven solutions from web development community
 */

import { useState, useCallback, useEffect } from 'react';
import type { OCRResult, OCRProgress } from '../ocr/ocr-types';

interface DynamicWorkerConfig {
  language: string;
  onProgress?: (_progress: OCRProgress) => void;
  onResult?: (_result: OCRResult) => void;
  onError?: (_error: Error) => void;
}

/**
 * Create a Tesseract.js worker using dynamic blob creation
 */
export class DynamicWorkerManager {
  private worker: Worker | null = null;
  private isInitialized = false;
  private config: DynamicWorkerConfig;

  constructor(config: DynamicWorkerConfig) {
    this.config = config;
  }

  /**
   * Create worker function as string (will be converted to blob)
   */
  private createWorkerFunction(): string {
    return `
      // Import Tesseract.js from absolute URL
      const origin = self.location.origin;
      importScripts(origin + '/workers/tesseract/tesseract.min.js');

      let tesseractWorker = null;
      let isInitialized = false;

      // Initialize Tesseract worker
      async function initializeTesseract(language) {
        try {
          tesseractWorker = await Tesseract.createWorker(language, 1, {
            langPath: origin + '/workers/tesseract/',
            gzip: false,
            workerPath: origin + '/workers/tesseract/worker.min.js',
            corePath: origin + '/workers/tesseract/tesseract-core.wasm.js',
            logger: (m) => {
              if (m.status && m.progress !== undefined) {
                self.postMessage({
                  type: 'PROGRESS',
                  payload: {
                    status: m.status,
                    progress: m.progress * 100,
                    message: m.status,
                    stage: m.status
                  }
                });
              }
            }
          });
          
          isInitialized = true;
          self.postMessage({ type: 'INITIALIZED', payload: { success: true } });
        } catch (error) {
          self.postMessage({ 
            type: 'ERROR', 
            payload: { 
              error: {
                code: 'INITIALIZATION_FAILED',
                message: error.message,
                details: error.stack
              }
            }
          });
        }
      }

      // Process image
      async function processImage(imageData) {
        if (!isInitialized || !tesseractWorker) {
          self.postMessage({ 
            type: 'ERROR', 
            payload: { 
              error: {
                code: 'WORKER_NOT_INITIALIZED',
                message: 'Worker not initialized'
              }
            }
          });
          return;
        }

        try {
          const startTime = Date.now();
          
          const result = await tesseractWorker.recognize(imageData, {
            logger: (m) => {
              if (m.status && m.progress !== undefined) {
                self.postMessage({
                  type: 'PROGRESS',
                  payload: {
                    status: m.status,
                    progress: m.progress * 100,
                    message: m.status,
                    stage: m.status
                  }
                });
              }
            }
          });

          const ocrResult = {
            text: result.data.text,
            confidence: result.data.confidence,
            words: result.data.words || [],
            lines: result.data.lines || [],
            paragraphs: result.data.paragraphs || [],
            blocks: result.data.blocks || [],
            bbox: result.data.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
            processingTime: Date.now() - startTime,
            language: '${this.config.language}'
          };

          self.postMessage({ type: 'RESULT', payload: { result: ocrResult } });
        } catch (error) {
          self.postMessage({ 
            type: 'ERROR', 
            payload: { 
              error: {
                code: 'PROCESSING_FAILED',
                message: error.message,
                details: error.stack
              }
            }
          });
        }
      }

      // Message handler
      self.addEventListener('message', async (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'INITIALIZE':
            await initializeTesseract(payload.language);
            break;
          case 'PROCESS_IMAGE':
            await processImage(payload.imageData);
            break;
          case 'TERMINATE':
            if (tesseractWorker) {
              await tesseractWorker.terminate();
            }
            self.postMessage({ type: 'TERMINATED', payload: { success: true } });
            break;
        }
      });

      // Error handlers
      self.addEventListener('error', (error) => {
        self.postMessage({ 
          type: 'ERROR', 
          payload: { 
            error: {
              code: 'WORKER_RUNTIME_ERROR',
              message: error.message,
              details: error.filename + ':' + error.lineno + ':' + error.colno
            }
          }
        });
      });

      self.addEventListener('unhandledrejection', (event) => {
        self.postMessage({ 
          type: 'ERROR', 
          payload: { 
            error: {
              code: 'WORKER_UNHANDLED_REJECTION',
              message: event.reason?.message || 'Unhandled promise rejection',
              details: event.reason?.stack || event.reason?.toString()
            }
          }
        });
      });
    `;
  }

  /**
   * Initialize the dynamic worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create worker function as blob
      const workerFunction = this.createWorkerFunction();
      const blob = new Blob([workerFunction], {
        type: 'application/javascript',
      });
      const workerUrl = URL.createObjectURL(blob);

      // Create worker from blob URL
      this.worker = new Worker(workerUrl);

      // Set up message handlers
      this.worker.onmessage = event => {
        const { type, payload } = event.data;

        switch (type) {
          case 'INITIALIZED':
            this.isInitialized = true;
            break;
          case 'PROGRESS':
            this.config.onProgress?.(payload);
            break;
          case 'RESULT':
            this.config.onResult?.(payload.result);
            break;
          case 'ERROR':
            this.config.onError?.(new Error(payload.error.message));
            break;
          case 'TERMINATED':
            this.cleanup();
            break;
        }
      };

      this.worker.onerror = error => {
        this.config.onError?.(new Error(`Worker error: ${error.message}`));
      };

      // Initialize Tesseract in worker
      this.worker.postMessage({
        type: 'INITIALIZE',
        payload: { language: this.config.language },
      });

      // Clean up blob URL after worker creation
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      throw new Error(`Failed to initialize dynamic worker: ${error}`);
    }
  }

  /**
   * Process image with OCR
   */
  async processImage(imageData: string): Promise<void> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('Worker not initialized');
    }

    this.worker.postMessage({
      type: 'PROCESS_IMAGE',
      payload: { imageData },
    });
  }

  /**
   * Terminate the worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      this.worker.postMessage({ type: 'TERMINATE' });
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }
}

/**
 * Hook for using dynamic worker in React components
 */
export function useDynamicWorker(language: string = 'ron') {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [worker, setWorker] = useState<DynamicWorkerManager | null>(null);

  const initializeWorker = useCallback(async () => {
    try {
      const workerManager = new DynamicWorkerManager({
        language,
        onProgress: setProgress,
        onResult: result => {
          setResult(result);
          setIsLoading(false);
        },
        onError: error => {
          setError(error);
          setIsLoading(false);
        },
      });

      await workerManager.initialize();
      setWorker(workerManager);
    } catch (err) {
      setError(err as Error);
    }
  }, [language]);

  const processImage = useCallback(
    async (imageData: string) => {
      if (!worker) {
        await initializeWorker();
        return;
      }

      setIsLoading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        await worker.processImage(imageData);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    },
    [worker, initializeWorker]
  );

  const cleanup = useCallback(async () => {
    if (worker) {
      await worker.terminate();
      setWorker(null);
    }
  }, [worker]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    processImage,
    isLoading,
    progress,
    result,
    error,
    cleanup,
  };
}
