/**
 * TypeScript interfaces for Romanian ID document processing
 * Defines data structures for extracted Romanian ID fields and API responses
 */

// Core Romanian ID fields based on official document structure
export interface RomanianIDFields {
  /** Surname (Nume) */
  nume: string | null;
  /** Given name (Prenume) */
  prenume: string | null;
  /** Personal Numeric Code (CNP) - Contains encoded birth date and sex information */
  cnp: string | null;
  /** Nationality (Cetățenie) */
  nationalitate: string | null;
  /** Sex (Sex) - Must be consistent with CNP's first digit (odd=M, even=F) */
  sex: string | null;
  /** Date of birth (Data nașterii) - NOT visible on Romanian ID cards, must be derived from CNP */
  data_nasterii: string | null;
  /** Place of birth (Locul nașterii) */
  locul_nasterii: string | null;
  /** Address/Domicile (Domiciliul) */
  domiciliul: string | null;
  /** ID series (Seria) */
  seria: string | null;
  /** ID number (Numărul) */
  numar: string | null;
  /** Issue date (Data eliberării) */
  data_eliberarii: string | null;
  /** Validity date (Valabil până la) - Day and month must match birth date (from CNP) */
  valabil_pana_la: string | null;
  /** Issuing authority (Eliberat de) */
  eliberat_de: string | null;
}

// Romanian ID extraction result with confidence scores
export interface RomanianIDExtractionResult {
  /** Extracted field values */
  fields: RomanianIDFields;

  /** Processing metadata */
  metadata: {
    /** Processing time in milliseconds */
    processing_time: number;
    /** Model used for extraction */
    model: string;
    /** Image quality assessment */
    image_quality: 'excellent' | 'good' | 'fair' | 'poor';
    /** Any warnings or issues during processing */
    warnings: string[];
    /** Optional validation results */
    validation?: {
      /** Validation score (0-1) */
      score: number;
      /** Improvement recommendations */
      recommendations: string[];
      /** Validation confidence */
      confidence: number;
    };
  };
}

// API request types
export interface AIVisionOCRRequest {
  /** Image file for processing */
  image: File;
  /** Optional custom extraction prompt */
  custom_prompt?: string;
  /** Processing options */
  options?: {
    /** Temperature for AI model (0-1) */
    temperature?: number;
    /** Maximum tokens for response */
    max_tokens?: number;
    /** Enable enhanced preprocessing */
    enhance_image?: boolean;
  };
}

// API response types
export interface AIVisionOCRResponse {
  /** Success status */
  success: boolean;
  /** Extracted Romanian ID data */
  data?: RomanianIDExtractionResult;
  /** Error information if processing failed */
  error?: {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: Record<string, any>;
  };
  /** Request processing metadata */
  metadata: {
    /** Request ID for tracking */
    request_id: string;
    /** Processing timestamp */
    timestamp: string;
    /** Total processing time in milliseconds */
    processing_time: number;
    /** Model performance metrics */
    performance?: {
      /** Model response time */
      model_response_time: number;
      /** Image preprocessing time */
      preprocessing_time: number;
      /** Response parsing time */
      parsing_time: number;
    };
  };
}

// Error codes for AI vision processing
export const AI_VISION_ERROR_CODES = {
  INVALID_IMAGE: 'INVALID_IMAGE',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AIVisionErrorCode =
  (typeof AI_VISION_ERROR_CODES)[keyof typeof AI_VISION_ERROR_CODES];

/**
 * Type guard to check if a string is a valid AIVisionErrorCode
 */
export function isValidErrorCode(code: string): code is AIVisionErrorCode {
  return Object.values(AI_VISION_ERROR_CODES).includes(
    code as AIVisionErrorCode
  );
}

/**
 * Get all available error codes
 */
export function getAllErrorCodes(): AIVisionErrorCode[] {
  return Object.values(AI_VISION_ERROR_CODES);
}

// Image processing options
export interface ImageProcessingOptions {
  /** Maximum width for image resizing */
  max_width?: number;
  /** Maximum height for image resizing */
  max_height?: number;
  /** JPEG quality (0-100) */
  quality?: number;
  /** Enable image enhancement */
  enhance?: boolean;
  /** Convert to grayscale */
  grayscale?: boolean;
}

// Validation result for Romanian ID fields
export interface RomanianIDValidationResult {
  /** Whether all fields are valid */
  is_valid: boolean;
  /** Field-specific validation results */
  field_validation: Record<
    keyof RomanianIDFields,
    {
      is_valid: boolean;
      error_message?: string;
      suggestions?: string[];
    }
  >;
  /** Overall validation summary */
  summary: {
    valid_fields: number;
    total_fields: number;
    critical_errors: string[];
    warnings: string[];
  };
}

// Processing status for tracking
export interface ProcessingStatus {
  /** Current processing stage */
  stage:
    | 'uploading'
    | 'validating'
    | 'preprocessing'
    | 'extracting'
    | 'validating_results'
    | 'completed'
    | 'failed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current operation description */
  message: string;
  /** Estimated time remaining in milliseconds */
  estimated_time_remaining?: number;
}
