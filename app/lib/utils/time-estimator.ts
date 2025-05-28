/**
 * Time Estimation Utilities for AI Processing
 * Calculates processing time based on image characteristics and system performance
 */

import type {
  TimeEstimation,
  ProcessingStage,
  ProcessingSession,
} from '@/lib/types/progress-types';
import {
  QWEN_PROCESSING_CONFIG,
  getStageInfo,
} from '@/lib/progress/processing-stages';

/**
 * Image size categories for time estimation
 */
export type ImageSizeCategory = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Image complexity levels for time estimation
 */
export type ImageComplexity = 'low' | 'medium' | 'high' | 'very_high';

/**
 * System performance levels
 */
export type SystemPerformance = 'low' | 'medium' | 'high';

/**
 * Determine image size category based on file size
 */
export function getImageSizeCategory(fileSizeBytes: number): ImageSizeCategory {
  const sizeMB = fileSizeBytes / (1024 * 1024);

  if (sizeMB < 1) return 'small';
  if (sizeMB < 5) return 'medium';
  if (sizeMB < 10) return 'large';
  return 'xlarge';
}

/**
 * Estimate image complexity based on dimensions and file size
 */
export function estimateImageComplexity(
  width: number,
  height: number,
  fileSize: number
): ImageComplexity {
  const pixels = width * height;
  const compressionRatio = fileSize / pixels;

  // High compression ratio suggests complex image
  if (compressionRatio > 0.5) return 'very_high';
  if (compressionRatio > 0.3) return 'high';
  if (compressionRatio > 0.1) return 'medium';
  return 'low';
}

/**
 * Estimate system performance based on available metrics
 */
export function estimateSystemPerformance(): SystemPerformance {
  // Use navigator.hardwareConcurrency as a proxy for system performance
  const cores = navigator.hardwareConcurrency || 4;

  // Check memory if available
  const memory = (navigator as any).deviceMemory || 4;

  // Simple heuristic based on cores and memory
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
}

/**
 * Get performance factor based on system performance
 */
export function getPerformanceFactor(performance: SystemPerformance): number {
  const performanceFactors = {
    low: 1.4, // 40% slower
    medium: 1.0, // baseline
    high: 0.7, // 30% faster
  };

  return performanceFactors[performance];
}

/**
 * Calculate time estimation for processing
 */
export function calculateTimeEstimation(imageMetadata: {
  size: number;
  width: number;
  height: number;
  format: string;
}): TimeEstimation {
  const { baseTime, sizeFactors, complexityFactors } =
    QWEN_PROCESSING_CONFIG.timeEstimation;

  // Determine factors
  const sizeCategory = getImageSizeCategory(imageMetadata.size);
  const complexity = estimateImageComplexity(
    imageMetadata.width,
    imageMetadata.height,
    imageMetadata.size
  );
  const systemPerformance = estimateSystemPerformance();

  // Get multipliers
  const sizeFactor = sizeFactors[sizeCategory] || 1.0;
  const complexityFactor = complexityFactors[complexity] || 1.0;
  const performanceFactor = getPerformanceFactor(systemPerformance);

  // Calculate estimated time
  const estimatedTime = Math.round(
    baseTime * sizeFactor * complexityFactor * performanceFactor
  );

  // Calculate confidence based on how "standard" the image is
  let confidence = 0.8; // Base confidence

  // Adjust confidence based on factors
  if (sizeCategory === 'medium' && complexity === 'medium') {
    confidence = 0.9; // High confidence for standard images
  } else if (sizeCategory === 'xlarge' || complexity === 'very_high') {
    confidence = 0.6; // Lower confidence for extreme cases
  }

  return {
    baseTime,
    sizeFactor,
    complexityFactor,
    performanceFactor,
    estimatedTime,
    confidence,
  };
}

/**
 * Update time estimation based on actual progress
 */
export function updateTimeEstimation(
  currentEstimation: TimeEstimation,
  elapsedTime: number,
  currentStage: ProcessingStage,
  stageProgress: number
): TimeEstimation {
  // Calculate how much of the total process should be complete
  const stageInfo = getStageInfo(currentStage);
  const expectedElapsedRatio =
    stageInfo.weight + (stageInfo.weight * stageProgress) / 100;

  if (expectedElapsedRatio > 0) {
    // Calculate actual vs expected time ratio
    const expectedElapsedTime =
      currentEstimation.estimatedTime * expectedElapsedRatio;
    const actualRatio = elapsedTime / expectedElapsedTime;

    // Adjust the estimated total time based on actual performance
    const adjustedEstimatedTime = Math.round(
      currentEstimation.estimatedTime * actualRatio
    );

    // Update confidence based on how close actual is to expected
    let adjustedConfidence = currentEstimation.confidence;
    const deviation = Math.abs(actualRatio - 1.0);

    if (deviation < 0.1) {
      adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.1);
    } else if (deviation > 0.5) {
      adjustedConfidence = Math.max(0.3, adjustedConfidence - 0.2);
    }

    return {
      ...currentEstimation,
      estimatedTime: adjustedEstimatedTime,
      confidence: adjustedConfidence,
    };
  }

  return currentEstimation;
}

/**
 * Calculate remaining time based on current progress
 */
export function calculateRemainingTime(
  timeEstimation: TimeEstimation,
  elapsedTime: number,
  overallProgress: number
): number {
  if (overallProgress <= 0) {
    return timeEstimation.estimatedTime;
  }

  if (overallProgress >= 100) {
    return 0;
  }

  // Use actual elapsed time to project remaining time
  const progressRatio = overallProgress / 100;
  const projectedTotalTime = elapsedTime / progressRatio;

  return Math.max(0, Math.round(projectedTotalTime - elapsedTime));
}

/**
 * Format time duration for display
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return '< 1s';
  }

  const seconds = Math.round(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format time with uncertainty
 */
export function formatTimeWithConfidence(
  milliseconds: number,
  confidence: number
): string {
  const baseTime = formatDuration(milliseconds);

  if (confidence >= 0.8) {
    return baseTime;
  } else if (confidence >= 0.6) {
    return `~${baseTime}`;
  } else {
    return `${baseTime}+`;
  }
}

/**
 * Calculate processing speed (stages per second)
 */
export function calculateProcessingSpeed(
  completedStages: ProcessingStage[],
  elapsedTime: number
): number {
  if (elapsedTime <= 0 || completedStages.length === 0) {
    return 0;
  }

  // Count meaningful stages (exclude idle, error, cancelled)
  const meaningfulStages = completedStages.filter(
    stage => !['idle', 'error', 'cancelled'].includes(stage)
  );

  return meaningfulStages.length / (elapsedTime / 1000);
}

/**
 * Estimate completion time based on historical data
 */
export function estimateCompletionTime(sessions: ProcessingSession[]): number {
  if (sessions.length === 0) {
    return QWEN_PROCESSING_CONFIG.expectedProcessingTime;
  }

  // Get completed sessions
  const completedSessions = sessions.filter(
    session => session.status === 'completed' && session.endTime
  );

  if (completedSessions.length === 0) {
    return QWEN_PROCESSING_CONFIG.expectedProcessingTime;
  }

  // Calculate average completion time
  const totalTime = completedSessions.reduce(
    (sum, session) => sum + (session.endTime! - session.startTime),
    0
  );

  return Math.round(totalTime / completedSessions.length);
}

/**
 * Get time estimation confidence level description
 */
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}

/**
 * Check if processing is taking longer than expected
 */
export function isProcessingDelayed(
  elapsedTime: number,
  estimatedTime: number,
  tolerance: number = 1.5
): boolean {
  return elapsedTime > estimatedTime * tolerance;
}

/**
 * Calculate efficiency score based on actual vs estimated time
 */
export function calculateEfficiency(
  actualTime: number,
  estimatedTime: number
): number {
  if (actualTime <= 0 || estimatedTime <= 0) {
    return 0;
  }

  // Efficiency is better when actual time is close to or less than estimated
  const ratio = estimatedTime / actualTime;
  return Math.min(1.0, Math.max(0.0, ratio));
}
