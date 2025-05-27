/**
 * File signature verification utilities
 * Provides functions to read file signatures (magic numbers) and verify file authenticity
 */

import type { FileSignature } from '@/lib/constants/supported-formats';

/**
 * Reads the first N bytes from a file
 */
export async function readFileBytes(
  file: File,
  length: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read only the required bytes for performance
    const blob = file.slice(0, length);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Reads bytes from a specific offset in a file
 */
export async function readFileBytesAtOffset(
  file: File,
  offset: number,
  length: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read from specific offset
    const blob = file.slice(offset, offset + length);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Compares two byte arrays for equality
 */
export function compareBytes(
  bytes1: Uint8Array,
  bytes2: readonly number[],
  mask?: readonly number[]
): boolean {
  if (bytes1.length < bytes2.length) {
    return false;
  }

  for (let i = 0; i < bytes2.length; i++) {
    const byte1 = bytes1[i];
    const byte2 = bytes2[i];

    if (byte1 === undefined || byte2 === undefined) {
      return false;
    }

    // Apply mask if provided
    if (mask && mask[i] !== undefined) {
      const maskedByte1 = byte1 & mask[i]!;
      const maskedByte2 = byte2 & mask[i]!;
      if (maskedByte1 !== maskedByte2) {
        return false;
      }
    } else {
      if (byte1 !== byte2) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Verifies a single file signature against file bytes
 */
export async function verifyFileSignature(
  file: File,
  signature: FileSignature
): Promise<boolean> {
  try {
    const requiredLength = signature.offset + signature.signature.length;

    // Check if file is large enough
    if (file.size < requiredLength) {
      return false;
    }

    // Read bytes from the specified offset
    const fileBytes = await readFileBytesAtOffset(
      file,
      signature.offset,
      signature.signature.length
    );

    // Compare with signature
    return compareBytes(fileBytes, signature.signature, signature.mask);
  } catch {
    return false;
  }
}

/**
 * Verifies if a file matches any of the provided signatures
 */
export async function verifyFileSignatures(
  file: File,
  signatures: readonly FileSignature[]
): Promise<boolean> {
  // For WEBP, we need to check both RIFF and WEBP signatures
  if (
    signatures.length === 2 &&
    signatures[0]?.signature[0] === 0x52 && // RIFF
    signatures[1]?.signature[0] === 0x57
  ) {
    // WEBP

    try {
      // Check RIFF signature at offset 0
      const riffMatch = await verifyFileSignature(file, signatures[0]);
      if (!riffMatch) return false;

      // Check WEBP signature at offset 8
      const webpMatch = await verifyFileSignature(file, signatures[1]);
      return webpMatch;
    } catch {
      return false;
    }
  }

  // For other formats, any matching signature is valid
  for (const signature of signatures) {
    try {
      const isMatch = await verifyFileSignature(file, signature);
      if (isMatch) {
        return true;
      }
    } catch {
      // Continue to next signature if this one fails
      continue;
    }
  }

  return false;
}

/**
 * Gets the maximum bytes needed to verify all signatures for a format
 */
export function getMaxSignatureLength(
  signatures: readonly FileSignature[]
): number {
  return Math.max(...signatures.map(sig => sig.offset + sig.signature.length));
}

/**
 * Detects file type based on signature verification
 */
export async function detectFileTypeBySignature(
  file: File,
  supportedFormats: Record<string, { signatures: readonly FileSignature[] }>
): Promise<string | null> {
  for (const [mimeType, format] of Object.entries(supportedFormats)) {
    try {
      const isMatch = await verifyFileSignatures(file, format.signatures);
      if (isMatch) {
        return mimeType;
      }
    } catch {
      // Continue to next format if verification fails
      continue;
    }
  }

  return null;
}

/**
 * Validates file signature with performance optimization
 * Only reads the minimum required bytes for verification
 */
export async function validateFileSignatureOptimized(
  file: File,
  signatures: readonly FileSignature[]
): Promise<{ isValid: boolean; detectedType?: string }> {
  try {
    // Calculate minimum bytes needed
    const maxLength = getMaxSignatureLength(signatures);

    // Check if file is large enough
    if (file.size < maxLength) {
      return { isValid: false };
    }

    // Read required bytes once
    const fileBytes = await readFileBytes(file, maxLength);

    // Check each signature
    for (const signature of signatures) {
      const signatureBytes = fileBytes.slice(
        signature.offset,
        signature.offset + signature.signature.length
      );

      if (compareBytes(signatureBytes, signature.signature, signature.mask)) {
        return { isValid: true };
      }
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}
