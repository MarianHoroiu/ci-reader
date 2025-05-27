/**
 * MIME type detection utilities
 * Provides functions to detect and validate MIME types from file content
 */

import { SUPPORTED_FORMATS } from '@/lib/constants/supported-formats';
import { detectFileTypeBySignature } from '@/lib/utils/file-signature';

export interface MimeTypeDetectionResult {
  /** Detected MIME type from file signature */
  detectedMimeType: string | null;
  /** MIME type reported by browser */
  reportedMimeType: string;
  /** Whether the detected and reported MIME types match */
  isConsistent: boolean;
  /** Whether the detected MIME type is supported */
  isSupported: boolean;
}

/**
 * Detects MIME type from file content using file signatures
 */
export async function detectMimeTypeFromContent(
  file: File
): Promise<string | null> {
  try {
    return await detectFileTypeBySignature(file, SUPPORTED_FORMATS);
  } catch {
    return null;
  }
}

/**
 * Validates MIME type consistency between reported and detected types
 */
export async function validateMimeTypeConsistency(
  file: File
): Promise<MimeTypeDetectionResult> {
  const reportedMimeType = file.type;
  const detectedMimeType = await detectMimeTypeFromContent(file);

  const isConsistent = detectedMimeType === reportedMimeType;
  const isSupported = detectedMimeType
    ? Object.keys(SUPPORTED_FORMATS).includes(detectedMimeType)
    : false;

  return {
    detectedMimeType,
    reportedMimeType,
    isConsistent,
    isSupported,
  };
}

/**
 * Checks if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return Object.keys(SUPPORTED_FORMATS).includes(mimeType);
}

/**
 * Gets the format configuration for a MIME type
 */
export function getFormatByMimeType(mimeType: string) {
  return SUPPORTED_FORMATS[mimeType] || null;
}

/**
 * Validates MIME type against file extension
 */
export function validateMimeTypeWithExtension(
  mimeType: string,
  fileName: string
): boolean {
  const format = getFormatByMimeType(mimeType);
  if (!format) return false;

  const fileExtension = getFileExtension(fileName);
  if (!fileExtension) return false;

  return format.extensions.includes(fileExtension);
}

/**
 * Extracts file extension from filename
 */
export function getFileExtension(fileName: string): string | null {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
    return null;
  }
  return fileName.slice(lastDotIndex).toLowerCase();
}

/**
 * Gets all supported extensions for a MIME type
 */
export function getSupportedExtensions(mimeType: string): readonly string[] {
  const format = getFormatByMimeType(mimeType);
  return format?.extensions || [];
}

/**
 * Detects MIME type from file extension
 */
export function detectMimeTypeFromExtension(fileName: string): string | null {
  const extension = getFileExtension(fileName);
  if (!extension) return null;

  for (const [mimeType, format] of Object.entries(SUPPORTED_FORMATS)) {
    if (format.extensions.includes(extension)) {
      return mimeType;
    }
  }

  return null;
}

/**
 * Comprehensive MIME type validation
 * Checks reported MIME type, file signature, and extension consistency
 */
export async function comprehensiveMimeTypeValidation(file: File): Promise<{
  isValid: boolean;
  reportedMimeType: string;
  detectedMimeType: string | null;
  extensionMimeType: string | null;
  isConsistent: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  const reportedMimeType = file.type;
  const detectedMimeType = await detectMimeTypeFromContent(file);
  const extensionMimeType = detectMimeTypeFromExtension(file.name);

  // Check if reported MIME type is supported
  if (!isSupportedMimeType(reportedMimeType)) {
    issues.push('Reported MIME type is not supported');
  }

  // Check if detected MIME type matches reported
  if (detectedMimeType && detectedMimeType !== reportedMimeType) {
    issues.push('File content does not match reported MIME type');
  }

  // Check if extension matches reported MIME type
  if (extensionMimeType && extensionMimeType !== reportedMimeType) {
    issues.push('File extension does not match reported MIME type');
  }

  // Check if we could detect any MIME type
  if (!detectedMimeType) {
    issues.push('Could not detect file type from content');
  }

  const isConsistent =
    detectedMimeType === reportedMimeType &&
    (extensionMimeType === null || extensionMimeType === reportedMimeType);

  const isValid =
    isSupportedMimeType(reportedMimeType) &&
    (detectedMimeType === null || detectedMimeType === reportedMimeType) &&
    issues.length === 0;

  return {
    isValid,
    reportedMimeType,
    detectedMimeType,
    extensionMimeType,
    isConsistent,
    issues,
  };
}
