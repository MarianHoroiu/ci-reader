/**
 * Utility functions for Web Worker operations
 * Handles compatibility checks, message handling, and data conversion
 */

import type {
  WorkerCompatibility,
  WorkerMessage,
  MainToWorkerMessage,
  WorkerToMainMessage,
} from './worker-types';

/**
 * Check browser compatibility for Web Workers and related features
 */
export function checkWorkerCompatibility(): WorkerCompatibility {
  const isSupported = typeof Worker !== 'undefined';
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  // Estimate max workers based on CPU cores (with reasonable limits)
  const maxWorkers = isSupported
    ? Math.min(Math.max(navigator.hardwareConcurrency || 2, 1), 4)
    : 0;

  const features: string[] = [];
  const limitations: string[] = [];

  if (isSupported) {
    features.push('Web Workers');
  } else {
    limitations.push('Web Workers not supported');
  }

  if (hasSharedArrayBuffer) {
    features.push('SharedArrayBuffer');
  } else {
    limitations.push('SharedArrayBuffer not available');
  }

  if (hasOffscreenCanvas) {
    features.push('OffscreenCanvas');
  } else {
    limitations.push('OffscreenCanvas not available');
  }

  // Check for additional features
  if (typeof MessageChannel !== 'undefined') {
    features.push('MessageChannel');
  }

  if (typeof Blob !== 'undefined') {
    features.push('Blob');
  }

  return {
    isSupported,
    hasSharedArrayBuffer,
    hasOffscreenCanvas,
    maxWorkers,
    features,
    limitations,
  };
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a worker message with proper structure
 */
export function createWorkerMessage<T extends MainToWorkerMessage>(
  type: T['type'],
  payload: T['payload']
): T {
  return {
    id: generateMessageId(),
    type,
    payload,
    timestamp: Date.now(),
  } as T;
}

/**
 * Validate worker message structure
 */
export function isValidWorkerMessage(
  message: unknown
): message is WorkerMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'id' in message &&
    'type' in message &&
    'timestamp' in message &&
    typeof (message as WorkerMessage).id === 'string' &&
    typeof (message as WorkerMessage).type === 'string' &&
    typeof (message as WorkerMessage).timestamp === 'number'
  );
}

/**
 * Convert File or Blob to ArrayBuffer
 */
export function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert File or Blob to base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert canvas to base64 string
 */
export function canvasToBase64(
  canvas: HTMLCanvasElement,
  quality = 0.9
): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Convert ImageData to base64 string
 */
export function imageDataToBase64(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Prepare image data for worker transmission
 */
export async function prepareImageForWorker(
  imageInput: string | File | ImageData | HTMLCanvasElement
): Promise<string> {
  if (typeof imageInput === 'string') {
    return imageInput;
  }

  if (imageInput instanceof File) {
    return await fileToBase64(imageInput);
  }

  if (imageInput instanceof HTMLCanvasElement) {
    return canvasToBase64(imageInput);
  }

  if (imageInput instanceof ImageData) {
    return imageDataToBase64(imageInput);
  }

  throw new Error('Unsupported image input type');
}

/**
 * Create a timeout promise
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([promise, createTimeout(timeoutMs)]);
}

/**
 * Safely post message to worker with error handling
 */
export function safePostMessage(
  worker: Worker,
  message: MainToWorkerMessage
): boolean {
  try {
    worker.postMessage(message);
    return true;
  } catch (error) {
    console.error('Failed to post message to worker:', error);
    return false;
  }
}

/**
 * Create a promise that resolves when worker sends specific message type
 */
export function waitForWorkerMessage<T extends WorkerToMainMessage>(
  worker: Worker,
  messageType: T['type'],
  timeoutMs = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for ${messageType} message`));
    }, timeoutMs);

    const messageHandler = (event: MessageEvent<WorkerToMainMessage>) => {
      if (event.data.type === messageType) {
        cleanup();
        resolve(event.data as T);
      }
    };

    const errorHandler = (error: ErrorEvent) => {
      cleanup();
      reject(new Error(`Worker error: ${error.message}`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
    };

    worker.addEventListener('message', messageHandler);
    worker.addEventListener('error', errorHandler);
  });
}

/**
 * Calculate memory usage estimate for image data
 */
export function estimateImageMemoryUsage(
  width: number,
  height: number,
  channels = 4
): number {
  return width * height * channels; // bytes
}

/**
 * Format memory usage for display
 */
export function formatMemoryUsage(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (..._args: unknown[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return ((..._args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(..._args);
    }, wait);
  }) as T;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (..._args: unknown[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;

  return ((..._args: Parameters<T>) => {
    if (!inThrottle) {
      func(..._args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  }) as T;
}
