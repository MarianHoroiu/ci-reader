/**
 * File upload utility functions for Romanian ID document processing
 */

// Supported file types for Romanian ID documents
export const SUPPORTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
} as const;

export const SUPPORTED_EXTENSIONS = Object.values(SUPPORTED_FILE_TYPES).flat();
export const SUPPORTED_MIME_TYPES = Object.keys(SUPPORTED_FILE_TYPES);

// File size limits (10MB as per requirements)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'NO_FILE';
}

/**
 * Validates if a file is supported for Romanian ID document processing
 */
export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided',
      errorCode: 'NO_FILE',
    };
  }

  // Check file type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type. Please upload JPG, PNG, WEBP, or PDF files.`,
      errorCode: 'INVALID_TYPE',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: `File size too large. Maximum size is ${maxSizeMB}MB.`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: File[]): {
  validFiles: File[];
  invalidFiles: Array<{ file: File; error: string; errorCode: string }>;
} {
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; error: string; errorCode: string }> =
    [];

  files.forEach(file => {
    const validation = validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file,
        error: validation.error!,
        errorCode: validation.errorCode!,
      });
    }
  });

  return { validFiles, invalidFiles };
}

/**
 * Checks if a file type is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Checks if a file type is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates a preview URL for image files
 */
export function createFilePreview(file: File): string | null {
  if (!isImageFile(file)) return null;
  return URL.createObjectURL(file);
}

/**
 * Cleans up object URLs to prevent memory leaks
 */
export function revokeFilePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Converts FileList to Array
 */
export function fileListToArray(fileList: FileList): File[] {
  return Array.from(fileList);
}

/**
 * Checks if drag event contains files
 */
export function hasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

/**
 * Gets files from drag event
 */
export function getFilesFromDragEvent(event: DragEvent): File[] {
  const files = event.dataTransfer?.files;
  return files ? fileListToArray(files) : [];
}

/**
 * Prevents default drag behaviors
 */
export function preventDefaults(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Generates a unique ID for file tracking
 */
export function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
