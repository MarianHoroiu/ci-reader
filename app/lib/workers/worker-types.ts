/**
 * TypeScript interfaces for Web Worker communication
 * Defines message types and data structures for OCR worker operations
 */

import type {
  OCRResult,
  OCRProgress,
  OCRError,
  OCRProcessingOptions,
  PreprocessingResult,
} from '../ocr/ocr-types';

// Base message interface
export interface WorkerMessage {
  id: string;
  type: string;
  timestamp: number;
}

// Message types
export type WorkerMessageType =
  | 'INITIALIZE'
  | 'PROCESS_IMAGE'
  | 'TERMINATE'
  | 'GET_STATUS'
  | 'PROGRESS_UPDATE'
  | 'RESULT'
  | 'ERROR'
  | 'STATUS_RESPONSE'
  | 'INITIALIZED'
  | 'TERMINATED';

// Worker initialization message
export interface InitializeWorkerMessage extends WorkerMessage {
  type: 'INITIALIZE';
  payload: {
    language: string;
    workerConfig: {
      langPath: string;
      gzip: boolean;
      corePath?: string;
      workerPath?: string;
    };
    ocrConfig: {
      oem: number;
      psm: number;
      tesseditCharWhitelist?: string;
      tesseditCharBlacklist?: string;
      preserveInterwordSpaces?: boolean;
    };
  };
}

// Image processing message
export interface ProcessImageMessage extends WorkerMessage {
  type: 'PROCESS_IMAGE';
  payload: {
    imageData: string | ArrayBuffer; // Base64 string or ArrayBuffer
    options: OCRProcessingOptions;
    preprocessingOptions?: {
      convertToGrayscale?: boolean;
      enhanceContrast?: boolean;
      removeNoise?: boolean;
    };
  };
}

// Worker termination message
export interface TerminateWorkerMessage extends WorkerMessage {
  type: 'TERMINATE';
  payload?: {
    force?: boolean;
  };
}

// Status request message
export interface GetStatusMessage extends WorkerMessage {
  type: 'GET_STATUS';
  payload?: Record<string, never>;
}

// Progress update message (from worker to main thread)
export interface ProgressUpdateMessage extends WorkerMessage {
  type: 'PROGRESS_UPDATE';
  payload: {
    progress: OCRProgress;
    jobId: string;
  };
}

// Result message (from worker to main thread)
export interface ResultMessage extends WorkerMessage {
  type: 'RESULT';
  payload: {
    result: OCRResult;
    preprocessingResult?: PreprocessingResult;
    jobId: string;
  };
}

// Error message (from worker to main thread)
export interface ErrorMessage extends WorkerMessage {
  type: 'ERROR';
  payload: {
    error: OCRError;
    jobId?: string;
  };
}

// Status response message (from worker to main thread)
export interface StatusResponseMessage extends WorkerMessage {
  type: 'STATUS_RESPONSE';
  payload: {
    isInitialized: boolean;
    isProcessing: boolean;
    currentLanguage: string;
    memoryUsage?: number;
    lastError?: OCRError;
  };
}

// Initialization complete message (from worker to main thread)
export interface InitializedMessage extends WorkerMessage {
  type: 'INITIALIZED';
  payload: {
    success: boolean;
    language: string;
    error?: OCRError;
  };
}

// Termination complete message (from worker to main thread)
export interface TerminatedMessage extends WorkerMessage {
  type: 'TERMINATED';
  payload: {
    success: boolean;
    error?: OCRError;
  };
}

// Union type for all messages from main thread to worker
export type MainToWorkerMessage =
  | InitializeWorkerMessage
  | ProcessImageMessage
  | TerminateWorkerMessage
  | GetStatusMessage;

// Union type for all messages from worker to main thread
export type WorkerToMainMessage =
  | ProgressUpdateMessage
  | ResultMessage
  | ErrorMessage
  | StatusResponseMessage
  | InitializedMessage
  | TerminatedMessage;

// Worker state interface
export interface WorkerState {
  id: string;
  isInitialized: boolean;
  isProcessing: boolean;
  currentLanguage: string;
  createdAt: Date;
  lastUsed: Date;
  processingJobs: Set<string>;
  worker: Worker;
}

// Worker pool configuration
export interface WorkerPoolConfig {
  maxWorkers: number;
  idleTimeout: number; // milliseconds
  initializationTimeout: number; // milliseconds
  processingTimeout: number; // milliseconds
  enableLogging: boolean;
}

// Worker job interface
export interface WorkerJob {
  id: string;
  type: 'PROCESS_IMAGE';
  payload: ProcessImageMessage['payload'];
  createdAt: Date;
  timeout?: number;
  onProgress?: (_progress: OCRProgress) => void;
  onResult?: (_result: OCRResult, _preprocessing?: PreprocessingResult) => void;
  onError?: (_error: OCRError) => void;
}

// Worker manager events
export interface WorkerManagerEvents {
  workerCreated: (_workerId: string) => void;
  workerTerminated: (_workerId: string) => void;
  workerError: (_workerId: string, _error: OCRError) => void;
  jobStarted: (_jobId: string, _workerId: string) => void;
  jobCompleted: (_jobId: string, _workerId: string) => void;
  jobFailed: (_jobId: string, _workerId: string, _error: OCRError) => void;
}

// Browser compatibility check result
export interface WorkerCompatibility {
  isSupported: boolean;
  hasSharedArrayBuffer: boolean;
  hasOffscreenCanvas: boolean;
  maxWorkers: number;
  features: string[];
  limitations: string[];
}

// Worker performance metrics
export interface WorkerMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  memoryUsage: number;
  activeWorkers: number;
  idleWorkers: number;
}
