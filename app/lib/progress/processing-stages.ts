/**
 * Processing Stages Configuration for Qwen2.5-VL-7B-Instruct
 * Defines the stages, timing, and weights for AI processing pipeline
 */

import type {
  ProcessingStage,
  ProcessingStageInfo,
  QwenProcessingConfig,
} from '@/lib/types/progress-types';

/**
 * Processing stages for Qwen2.5-VL pipeline
 * Total expected time: ~8 seconds
 */
export const PROCESSING_STAGES: ProcessingStageInfo[] = [
  {
    stage: 'idle',
    name: 'Ready',
    description: 'Waiting for processing to begin',
    expectedDuration: 0,
    weight: 0,
    cancellable: true,
  },
  {
    stage: 'uploading',
    name: 'Uploading',
    description: 'Uploading image file',
    expectedDuration: 500, // 0.5 seconds
    weight: 0.05, // 5% of total progress
    cancellable: true,
  },
  {
    stage: 'preprocessing',
    name: 'Preprocessing',
    description: 'Optimizing image for AI analysis',
    expectedDuration: 1500, // 1.5 seconds
    weight: 0.15, // 15% of total progress
    cancellable: true,
  },
  {
    stage: 'ai-analysis',
    name: 'AI Analysis',
    description: 'Qwen2.5-VL analyzing document content',
    expectedDuration: 5000, // 5 seconds (main processing)
    weight: 0.6, // 60% of total progress
    cancellable: false, // Cannot cancel during AI processing
  },
  {
    stage: 'data-extraction',
    name: 'Data Extraction',
    description: 'Extracting structured data from AI response',
    expectedDuration: 800, // 0.8 seconds
    weight: 0.15, // 15% of total progress
    cancellable: false,
  },
  {
    stage: 'validation',
    name: 'Validation',
    description: 'Validating extracted data',
    expectedDuration: 200, // 0.2 seconds
    weight: 0.05, // 5% of total progress
    cancellable: false,
  },
  {
    stage: 'completed',
    name: 'Completed',
    description: 'Processing completed successfully',
    expectedDuration: 0,
    weight: 1, // 100% complete
    cancellable: false,
  },
  {
    stage: 'error',
    name: 'Error',
    description: 'Processing failed with error',
    expectedDuration: 0,
    weight: 0,
    cancellable: false,
  },
  {
    stage: 'cancelled',
    name: 'Cancelled',
    description: 'Processing was cancelled by user',
    expectedDuration: 0,
    weight: 0,
    cancellable: false,
  },
];

/**
 * Get stage information by stage identifier
 */
export function getStageInfo(stage: ProcessingStage): ProcessingStageInfo {
  const stageInfo = PROCESSING_STAGES.find(s => s.stage === stage);
  if (!stageInfo) {
    throw new Error(`Unknown processing stage: ${stage}`);
  }
  return stageInfo;
}

/**
 * Get the next stage in the processing pipeline
 */
export function getNextStage(
  currentStage: ProcessingStage
): ProcessingStage | null {
  const stageOrder: ProcessingStage[] = [
    'idle',
    'uploading',
    'preprocessing',
    'ai-analysis',
    'data-extraction',
    'validation',
    'completed',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null;
  }

  return stageOrder[currentIndex + 1] || null;
}

/**
 * Calculate cumulative progress weight up to a given stage
 */
export function getCumulativeWeight(stage: ProcessingStage): number {
  let cumulativeWeight = 0;

  for (const stageInfo of PROCESSING_STAGES) {
    if (stageInfo.stage === stage) {
      break;
    }
    if (
      stageInfo.stage !== 'idle' &&
      stageInfo.stage !== 'error' &&
      stageInfo.stage !== 'cancelled'
    ) {
      cumulativeWeight += stageInfo.weight;
    }
  }

  return cumulativeWeight;
}

/**
 * Calculate overall progress percentage based on current stage and stage progress
 */
export function calculateOverallProgress(
  currentStage: ProcessingStage,
  stageProgress: number
): number {
  const cumulativeWeight = getCumulativeWeight(currentStage);
  const currentStageInfo = getStageInfo(currentStage);
  const currentStageContribution =
    (currentStageInfo.weight * stageProgress) / 100;

  return Math.min(100, (cumulativeWeight + currentStageContribution) * 100);
}

/**
 * Get total expected processing time
 */
export function getTotalExpectedTime(): number {
  return PROCESSING_STAGES.filter(
    stage =>
      stage.stage !== 'idle' &&
      stage.stage !== 'error' &&
      stage.stage !== 'cancelled' &&
      stage.stage !== 'completed'
  ).reduce((total, stage) => total + stage.expectedDuration, 0);
}

/**
 * Check if a stage is cancellable
 */
export function isStageCancellable(stage: ProcessingStage): boolean {
  const stageInfo = getStageInfo(stage);
  return stageInfo.cancellable;
}

/**
 * Get processing stages that are active (not idle, error, cancelled, or completed)
 */
export function getActiveStages(): ProcessingStageInfo[] {
  return PROCESSING_STAGES.filter(
    stage => !['idle', 'error', 'cancelled', 'completed'].includes(stage.stage)
  );
}

/**
 * Qwen2.5-VL processing configuration
 */
export const QWEN_PROCESSING_CONFIG: QwenProcessingConfig = {
  expectedProcessingTime: getTotalExpectedTime(),
  stages: PROCESSING_STAGES,
  timeEstimation: {
    baseTime: 8000, // 8 seconds base time
    sizeFactors: {
      small: 0.8, // < 1MB
      medium: 1.0, // 1-5MB
      large: 1.3, // 5-10MB
      xlarge: 1.6, // > 10MB
    },
    complexityFactors: {
      low: 0.9, // Simple documents
      medium: 1.0, // Standard Romanian ID
      high: 1.2, // Complex or damaged documents
      very_high: 1.5, // Very poor quality or unusual format
    },
  },
  performanceThresholds: {
    maxProcessingTime: 15000, // 15 seconds maximum
    maxMemoryUsage: 512, // 512MB maximum
    minEfficiency: 0.7, // 70% minimum efficiency
  },
};

/**
 * Stage transition validation
 */
export function isValidStageTransition(
  fromStage: ProcessingStage,
  toStage: ProcessingStage
): boolean {
  // Allow transitions to error or cancelled from any stage
  if (toStage === 'error' || toStage === 'cancelled') {
    return true;
  }

  // Allow restart from completed, error, or cancelled
  if (
    ['completed', 'error', 'cancelled'].includes(fromStage) &&
    toStage === 'idle'
  ) {
    return true;
  }

  // Normal forward progression
  const nextStage = getNextStage(fromStage);
  return nextStage === toStage;
}

/**
 * Get stage display color for UI
 */
export function getStageColor(stage: ProcessingStage): string {
  const colorMap: Record<ProcessingStage, string> = {
    idle: 'gray',
    uploading: 'blue',
    preprocessing: 'yellow',
    'ai-analysis': 'purple',
    'data-extraction': 'indigo',
    validation: 'green',
    completed: 'green',
    error: 'red',
    cancelled: 'orange',
  };

  return colorMap[stage] || 'gray';
}

/**
 * Get stage icon for UI
 */
export function getStageIcon(stage: ProcessingStage): string {
  const iconMap: Record<ProcessingStage, string> = {
    idle: 'Clock',
    uploading: 'Upload',
    preprocessing: 'Settings',
    'ai-analysis': 'Brain',
    'data-extraction': 'FileText',
    validation: 'CheckCircle',
    completed: 'CheckCircle2',
    error: 'XCircle',
    cancelled: 'StopCircle',
  };

  return iconMap[stage] || 'Circle';
}
