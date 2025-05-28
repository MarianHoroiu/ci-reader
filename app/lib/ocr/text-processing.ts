/**
 * Text processing utilities for Romanian OCR results
 * Handles text cleanup, validation, and enhancement
 */

import {
  correctRomanianText,
  isValidRomanianText,
  ROMANIAN_ID_KEYWORDS,
  isValidCNP,
  parseCNP,
} from '../constants/romanian-characters';
import type { RomanianCharacterValidation } from './ocr-types';

/**
 * Clean and enhance OCR text for Romanian documents
 */
export function cleanOCRText(text: string, language: string = 'ron'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleaned = text;

  // Basic cleanup
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\s+/g, ' '); // Normalize whitespace
  cleaned = cleaned.replace(/[^\w\s\p{P}]/gu, ''); // Remove invalid characters

  // Romanian-specific corrections
  if (language === 'ron' || language.includes('ron')) {
    cleaned = correctRomanianText(cleaned);
  }

  return cleaned;
}

/**
 * Validate Romanian text and provide suggestions
 */
export function validateRomanianText(
  text: string
): RomanianCharacterValidation {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      invalidCharacters: [],
      suggestions: [],
      confidence: 0,
    };
  }

  const isValid = isValidRomanianText(text);
  const invalidCharacters: string[] = [];
  const suggestions: string[] = [];

  if (!isValid) {
    // Find invalid characters
    const chars = text.split('');
    chars.forEach(char => {
      if (!isValidRomanianText(char) && !invalidCharacters.includes(char)) {
        invalidCharacters.push(char);
      }
    });

    // Provide suggestions
    if (invalidCharacters.length > 0) {
      suggestions.push('Consider using Romanian character corrections');
      suggestions.push('Check for OCR misrecognitions of special characters');
    }
  }

  const confidence = isValid
    ? 1.0
    : Math.max(0, 1 - invalidCharacters.length / text.length);

  return {
    isValid,
    invalidCharacters,
    suggestions,
    confidence,
  };
}

/**
 * Extract potential Romanian ID fields from text
 */
export function extractIDFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  for (const line of lines) {
    // Extract CNP (13 digits)
    const cnpMatch = line.match(/\b\d{13}\b/);
    if (cnpMatch && isValidCNP(cnpMatch[0])) {
      fields.cnp = cnpMatch[0];
    }

    // Extract series and number (format: XX 123456)
    const seriesMatch = line.match(/\b[A-Z]{2}\s+\d{6}\b/);
    if (seriesMatch) {
      const parts = seriesMatch[0].split(/\s+/);
      fields.series = parts[0] || '';
      fields.number = parts[1] || '';
    }

    // Extract dates (DD.MM.YYYY or DD/MM/YYYY)
    const dateMatch = line.match(/\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/);
    if (dateMatch) {
      if (!fields.birthDate && line.toLowerCase().includes('naș')) {
        fields.birthDate = dateMatch[0];
      } else if (!fields.issueDate && line.toLowerCase().includes('elib')) {
        fields.issueDate = dateMatch[0];
      } else if (!fields.expiryDate && line.toLowerCase().includes('val')) {
        fields.expiryDate = dateMatch[0];
      }
    }

    // Extract names (lines with Romanian ID keywords)
    if (line.toLowerCase().includes('nume') && !fields.lastName) {
      const nameMatch = line.match(/nume[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        fields.lastName = nameMatch[1].trim();
      }
    }

    if (line.toLowerCase().includes('prenume') && !fields.firstName) {
      const nameMatch = line.match(/prenume[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț\s]+)/i);
      if (nameMatch && nameMatch[1]) {
        fields.firstName = nameMatch[1].trim();
      }
    }
  }

  return fields;
}

/**
 * Calculate text confidence score based on various factors
 */
export function calculateTextConfidence(
  text: string,
  ocrConfidence: number,
  language: string = 'ron'
): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  let confidence = ocrConfidence / 100; // Normalize to 0-1

  // Romanian-specific confidence adjustments
  if (language === 'ron' || language.includes('ron')) {
    const validation = validateRomanianText(text);
    confidence = (confidence + validation.confidence) / 2;

    // Boost confidence if Romanian keywords are found
    const keywordCount = ROMANIAN_ID_KEYWORDS.filter(keyword =>
      text.toUpperCase().includes(keyword)
    ).length;

    if (keywordCount > 0) {
      confidence = Math.min(1.0, confidence + keywordCount * 0.05);
    }
  }

  // Penalize very short or very long texts
  if (text.length < 3) {
    confidence *= 0.5;
  } else if (text.length > 1000) {
    confidence *= 0.8;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Enhance OCR text using context and patterns
 */
export function enhanceOCRText(
  text: string,
  context: string = 'id_document'
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let enhanced = cleanOCRText(text);

  // Context-specific enhancements
  if (context === 'id_document') {
    // Fix common OCR errors in Romanian ID documents
    enhanced = enhanced.replace(/0/g, 'O'); // Zero to O in names
    enhanced = enhanced.replace(/1/g, 'I'); // One to I in names
    enhanced = enhanced.replace(/5/g, 'S'); // Five to S in names

    // Restore numbers in specific contexts
    enhanced = enhanced.replace(/CNP[:\s]*([OI]+)/gi, (match, _p1) => {
      return match.replace(/[OI]/g, '0');
    });
  }

  return enhanced;
}

/**
 * Split text into logical sections for ID documents
 */
export function splitIDDocumentText(text: string): {
  header: string;
  personalInfo: string;
  address: string;
  documentInfo: string;
  footer: string;
} {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const sections = {
    header: '',
    personalInfo: '',
    address: '',
    documentInfo: '',
    footer: '',
  };

  let currentSection = 'header';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Determine section based on keywords
    if (
      lowerLine.includes('romania') ||
      lowerLine.includes('carte') ||
      lowerLine.includes('identitate')
    ) {
      currentSection = 'header';
    } else if (
      lowerLine.includes('nume') ||
      lowerLine.includes('prenume') ||
      lowerLine.includes('cnp')
    ) {
      currentSection = 'personalInfo';
    } else if (
      lowerLine.includes('domicil') ||
      lowerLine.includes('strada') ||
      lowerLine.includes('oraș')
    ) {
      currentSection = 'address';
    } else if (
      lowerLine.includes('seria') ||
      lowerLine.includes('eliberat') ||
      lowerLine.includes('valabil')
    ) {
      currentSection = 'documentInfo';
    }

    // Add line to current section
    if (sections[currentSection as keyof typeof sections]) {
      sections[currentSection as keyof typeof sections] +=
        (sections[currentSection as keyof typeof sections] ? '\n' : '') + line;
    }
  }

  return sections;
}

/**
 * Extract and validate CNP information
 */
export function extractCNPInfo(text: string): {
  cnp: string | null;
  isValid: boolean;
  info: ReturnType<typeof parseCNP> | null;
} {
  const cnpMatch = text.match(/\b\d{13}\b/);

  if (!cnpMatch) {
    return {
      cnp: null,
      isValid: false,
      info: null,
    };
  }

  const cnp = cnpMatch[0];
  const isValid = isValidCNP(cnp);
  const info = isValid ? parseCNP(cnp) : null;

  return {
    cnp,
    isValid,
    info,
  };
}
