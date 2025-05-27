/**
 * Progress calculation utilities for file upload operations
 * Handles progress tracking for upload, validation, and compression phases
 */

export type UploadPhase =
  | 'uploading'
  | 'validating'
  | 'compressing'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface ProgressState {
  phase: UploadPhase;
  percentage: number;
  bytesLoaded: number;
  bytesTotal: number;
  startTime: number;
  estimatedTimeRemaining?: number;
  speed?: number; // bytes per second
}

export interface MultiFileProgress {
  files: Map<string, ProgressState>;
  overallProgress: number;
  activeUploads: number;
  completedUploads: number;
  failedUploads: number;
}

/**
 * Calculate progress percentage from bytes loaded and total
 */
export function calculatePercentage(loaded: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.round((loaded / total) * 100), 100);
}

/**
 * Calculate upload speed in bytes per second
 */
export function calculateSpeed(bytesLoaded: number, startTime: number): number {
  const elapsedTime = (Date.now() - startTime) / 1000; // seconds
  if (elapsedTime === 0) return 0;
  return bytesLoaded / elapsedTime;
}

/**
 * Calculate estimated time remaining in seconds
 */
export function calculateTimeRemaining(
  bytesLoaded: number,
  bytesTotal: number,
  speed: number
): number {
  if (speed === 0 || bytesLoaded >= bytesTotal) return 0;
  const remainingBytes = bytesTotal - bytesLoaded;
  return Math.round(remainingBytes / speed);
}

/**
 * Format time in seconds to human readable format
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 1) return 'Less than a second';
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''}`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format upload speed to human readable format
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

/**
 * Create initial progress state for a file
 */
export function createInitialProgress(fileSize: number): ProgressState {
  return {
    phase: 'uploading',
    percentage: 0,
    bytesLoaded: 0,
    bytesTotal: fileSize,
    startTime: Date.now(),
    estimatedTimeRemaining: 0,
    speed: 0,
  };
}

/**
 * Update progress state with new loaded bytes
 */
export function updateProgress(
  currentState: ProgressState,
  bytesLoaded: number
): ProgressState {
  const percentage = calculatePercentage(bytesLoaded, currentState.bytesTotal);
  const speed = calculateSpeed(bytesLoaded, currentState.startTime);
  const estimatedTimeRemaining = calculateTimeRemaining(
    bytesLoaded,
    currentState.bytesTotal,
    speed
  );

  return {
    ...currentState,
    percentage,
    bytesLoaded,
    speed,
    estimatedTimeRemaining,
  };
}

/**
 * Calculate overall progress for multiple files
 */
export function calculateOverallProgress(
  files: Map<string, ProgressState>
): number {
  if (files.size === 0) return 0;

  let totalBytes = 0;
  let loadedBytes = 0;

  files.forEach(progress => {
    totalBytes += progress.bytesTotal;
    loadedBytes += progress.bytesLoaded;
  });

  return calculatePercentage(loadedBytes, totalBytes);
}

/**
 * Get phase-specific progress weights for more accurate overall calculation
 */
export function getPhaseWeight(phase: UploadPhase): number {
  switch (phase) {
    case 'uploading':
      return 0.7; // 70% of total progress
    case 'validating':
      return 0.2; // 20% of total progress
    case 'compressing':
      return 0.1; // 10% of total progress
    case 'complete':
      return 1.0;
    case 'error':
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
}

/**
 * Calculate weighted progress considering different phases
 */
export function calculateWeightedProgress(
  phase: UploadPhase,
  phaseProgress: number
): number {
  switch (phase) {
    case 'uploading':
      return phaseProgress * 0.7; // 0-70%
    case 'validating':
      return 70 + phaseProgress * 0.2; // 70-90%
    case 'compressing':
      return 90 + phaseProgress * 0.1; // 90-100%
    case 'complete':
      return 100;
    default:
      return 0;
  }
}

/**
 * Create multi-file progress tracker
 */
export function createMultiFileProgress(): MultiFileProgress {
  return {
    files: new Map(),
    overallProgress: 0,
    activeUploads: 0,
    completedUploads: 0,
    failedUploads: 0,
  };
}

/**
 * Update multi-file progress state
 */
export function updateMultiFileProgress(
  current: MultiFileProgress,
  fileId: string,
  progress: ProgressState
): MultiFileProgress {
  const newFiles = new Map(current.files);
  newFiles.set(fileId, progress);

  let activeUploads = 0;
  let completedUploads = 0;
  let failedUploads = 0;

  newFiles.forEach(fileProgress => {
    switch (fileProgress.phase) {
      case 'uploading':
      case 'validating':
      case 'compressing':
        activeUploads++;
        break;
      case 'complete':
        completedUploads++;
        break;
      case 'error':
      case 'cancelled':
        failedUploads++;
        break;
    }
  });

  const overallProgress = calculateOverallProgress(newFiles);

  return {
    files: newFiles,
    overallProgress,
    activeUploads,
    completedUploads,
    failedUploads,
  };
}
