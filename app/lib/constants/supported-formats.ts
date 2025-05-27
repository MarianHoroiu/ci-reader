/**
 * Supported file formats for Romanian ID document processing
 * Includes MIME types, extensions, and file signatures (magic numbers)
 */

export interface FileSignature {
  /** File signature bytes (magic numbers) */
  signature: readonly number[];
  /** Offset where signature should be found */
  offset: number;
  /** Optional mask for signature matching */
  mask?: readonly number[];
}

export interface SupportedFormat {
  /** MIME type */
  mimeType: string;
  /** File extensions */
  extensions: readonly string[];
  /** File signatures for verification */
  signatures: readonly FileSignature[];
  /** Human-readable format name */
  name: string;
  /** Maximum file size in bytes */
  maxSize?: number;
}

// File signatures (magic numbers) for supported formats
export const FILE_SIGNATURES = {
  JPEG: [
    { signature: [0xff, 0xd8, 0xff], offset: 0 }, // JPEG/JFIF
    { signature: [0xff, 0xd8, 0xff, 0xe0], offset: 0 }, // JPEG/JFIF
    { signature: [0xff, 0xd8, 0xff, 0xe1], offset: 0 }, // JPEG/Exif
  ],
  PNG: [
    { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  ],
  WEBP: [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF"
    { signature: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP"
  ],
  PDF: [
    { signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }, // "%PDF"
  ],
} as const;

// Supported formats configuration
export const SUPPORTED_FORMATS: Record<string, SupportedFormat> = {
  'image/jpeg': {
    mimeType: 'image/jpeg',
    extensions: ['.jpg', '.jpeg'],
    signatures: FILE_SIGNATURES.JPEG,
    name: 'JPEG Image',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  'image/png': {
    mimeType: 'image/png',
    extensions: ['.png'],
    signatures: FILE_SIGNATURES.PNG,
    name: 'PNG Image',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  'image/webp': {
    mimeType: 'image/webp',
    extensions: ['.webp'],
    signatures: FILE_SIGNATURES.WEBP,
    name: 'WebP Image',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  'application/pdf': {
    mimeType: 'application/pdf',
    extensions: ['.pdf'],
    signatures: FILE_SIGNATURES.PDF,
    name: 'PDF Document',
    maxSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

// Derived constants for easy access
export const SUPPORTED_MIME_TYPES = Object.keys(SUPPORTED_FORMATS);
export const SUPPORTED_EXTENSIONS = Object.values(SUPPORTED_FORMATS).flatMap(
  format => format.extensions
);

// Maximum file size (10MB as per requirements)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Error codes for validation failures
export const VALIDATION_ERROR_CODES = {
  NO_FILE: 'NO_FILE',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  INVALID_EXTENSION: 'INVALID_EXTENSION',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
} as const;

export type ValidationErrorCode =
  (typeof VALIDATION_ERROR_CODES)[keyof typeof VALIDATION_ERROR_CODES];

// User-friendly error messages
export const ERROR_MESSAGES: Record<ValidationErrorCode, string> = {
  [VALIDATION_ERROR_CODES.NO_FILE]: 'No file provided',
  [VALIDATION_ERROR_CODES.INVALID_MIME_TYPE]:
    'Invalid file type. Please upload JPG, PNG, WEBP, or PDF files.',
  [VALIDATION_ERROR_CODES.INVALID_EXTENSION]:
    'Invalid file extension. Please ensure your file has the correct extension.',
  [VALIDATION_ERROR_CODES.INVALID_SIGNATURE]:
    'File appears to be corrupted or has an invalid format. Please try a different file.',
  [VALIDATION_ERROR_CODES.FILE_TOO_LARGE]:
    'File size too large. Maximum size is 10MB.',
  [VALIDATION_ERROR_CODES.CORRUPTED_FILE]:
    'File appears to be corrupted. Please try a different file.',
  [VALIDATION_ERROR_CODES.UNSUPPORTED_FORMAT]:
    'Unsupported file format. Please upload JPG, PNG, WEBP, or PDF files.',
};
