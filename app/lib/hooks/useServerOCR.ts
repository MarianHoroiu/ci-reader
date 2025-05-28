/**
 * Server-Side OCR Hook
 * Uses API route for OCR processing (Solution 2)
 * Avoids client-side worker issues by processing on server
 */

import { useState, useCallback } from 'react';
import type { OCRResult, OCRProgress } from '../ocr/ocr-types';

interface UseServerOCROptions {
  language?: string;
  onProgress?: (_progress: OCRProgress) => void;
  onResult?: (_result: OCRResult) => void;
  onError?: (_error: Error) => void;
}

interface ServerOCRResponse {
  success: boolean;
  result?: OCRResult;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export function useServerOCR(options: UseServerOCROptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const processImage = useCallback(
    async (imageData: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        // Simulate progress updates since server-side processing doesn't provide real-time progress
        const progressSteps: OCRProgress[] = [
          {
            status: 'initializing',
            progress: 10,
            message: 'Initializing OCR engine...',
            stage: 'initializing',
          },
          {
            status: 'loading',
            progress: 30,
            message: 'Loading language data...',
            stage: 'loading',
          },
          {
            status: 'recognizing',
            progress: 60,
            message: 'Recognizing text...',
            stage: 'recognizing',
          },
          {
            status: 'recognizing',
            progress: 90,
            message: 'Processing results...',
            stage: 'recognizing',
          },
        ];

        // Send progress updates with delays
        for (const step of progressSteps) {
          setProgress(step);
          options.onProgress?.(step);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Make API request to server-side OCR
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData,
            language: options.language || 'ron',
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ServerOCRResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'OCR processing failed');
        }

        if (!data.result) {
          throw new Error('No result returned from OCR processing');
        }

        // Final progress update
        const finalProgress: OCRProgress = {
          status: 'completed',
          progress: 100,
          message: 'OCR completed successfully!',
          stage: 'completed',
        };
        setProgress(finalProgress);
        options.onProgress?.(finalProgress);

        // Set result
        setResult(data.result);
        options.onResult?.(data.result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        console.error('Server OCR processing failed:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    processImage,
    isLoading,
    progress,
    result,
    error,
    reset,
  };
}

/**
 * Romanian ID specific server OCR hook
 */
export function useRomanianIDServerOCR() {
  const [extractedData, setExtractedData] = useState<any>(null);

  const serverOCR = useServerOCR({
    language: 'ron',
    onResult: result => {
      // Process Romanian ID specific data extraction
      const text = result.text;

      // Basic Romanian ID data extraction (can be enhanced)
      const extractedInfo = {
        text: text, // Use 'text' to match UI expectations
        fullText: text,
        confidence: result.confidence,
        processingTime: result.processingTime,
        words: result.words || [],
        lines: result.lines || [],
        paragraphs: result.paragraphs || [],
        blocks: result.blocks || [],
        bbox: result.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        language: result.language,
        // Add Romanian ID specific parsing here
        fields: parseRomanianIDText(text),
      };

      console.log('Setting extracted data:', extractedInfo);
      setExtractedData(extractedInfo);
    },
  });

  const processRomanianID = useCallback(
    async (imageData: string) => {
      setExtractedData(null);
      await serverOCR.processImage(imageData);
    },
    [serverOCR]
  );

  return {
    ...serverOCR,
    processRomanianID,
    extractedData,
  };
}

/**
 * Enhanced Romanian ID text parsing
 * Extracts all common fields from Romanian identity cards
 */
function parseRomanianIDText(text: string) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const fields: Record<string, string> = {};

  // Join all text for pattern matching
  const fullText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  console.log('Parsing Romanian ID text:', fullText);

  // Enhanced parsing patterns for Romanian ID
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const nextLine = lines[i + 1] || '';
    const prevLine = lines[i - 1] || '';

    // Name patterns (NUME/NAME followed by surname)
    if (line.match(/NUME|NAME/i) && !fields.lastName) {
      // Try current line first
      let nameMatch = line.replace(/NUME|NAME/gi, '').trim();
      if (!nameMatch && nextLine) {
        nameMatch = nextLine.trim();
      }
      if (nameMatch && nameMatch.length > 1) {
        fields.lastName = nameMatch;
      }
    }

    // Given name patterns (PRENUME/GIVEN followed by first name)
    if (line.match(/PRENUME|GIVEN/i) && !fields.firstName) {
      let nameMatch = line.replace(/PRENUME|GIVEN/gi, '').trim();
      if (!nameMatch && nextLine) {
        nameMatch = nextLine.trim();
      }
      if (nameMatch && nameMatch.length > 1) {
        fields.firstName = nameMatch;
      }
    }

    // CNP (13-digit personal numeric code)
    const cnpMatch = line.match(/\b\d{13}\b/);
    if (cnpMatch && !fields.cnp) {
      fields.cnp = cnpMatch[0];
    }

    // Series and number patterns
    if (line.match(/SERIA|SERIES/i) && !fields.series) {
      const seriesMatch = line.replace(/SERIA|SERIES/gi, '').trim();
      if (seriesMatch) {
        fields.series = seriesMatch;
      }
    }

    // Date patterns (DD.MM.YYYY or DD/MM/YYYY)
    const dateMatch = line.match(/\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/);
    if (dateMatch) {
      if (
        line.match(/NĂSCUT|BORN|NASC/i) ||
        prevLine.match(/NĂSCUT|BORN|NASC/i)
      ) {
        fields.birthDate = dateMatch[0];
      } else if (
        line.match(/VALABIL|VALID|EXPIRES/i) ||
        prevLine.match(/VALABIL|VALID|EXPIRES/i)
      ) {
        fields.validUntil = dateMatch[0];
      }
    }

    // Birth place patterns
    if (line.match(/NĂSCUT|BORN/i) && !fields.birthPlace) {
      const birthMatch = line
        .replace(/NĂSCUT|BORN/gi, '')
        .replace(/\d{1,2}[./]\d{1,2}[./]\d{4}/, '')
        .trim();
      if (birthMatch && birthMatch.length > 2) {
        fields.birthPlace = birthMatch;
      }
    }

    // Address patterns (DOMICILIUL/ADDRESS)
    if (line.match(/DOMICILIUL|ADDRESS|ADRESA/i) && !fields.address) {
      let addressMatch = line.replace(/DOMICILIUL|ADDRESS|ADRESA/gi, '').trim();
      // If address continues on next lines, combine them
      if (
        nextLine &&
        !nextLine.match(/NUME|NAME|PRENUME|GIVEN|CNP|SERIA|NĂSCUT|VALABIL/i)
      ) {
        addressMatch += ' ' + nextLine.trim();
        if (
          lines[i + 2] &&
          !lines[i + 2]?.match(
            /NUME|NAME|PRENUME|GIVEN|CNP|SERIA|NĂSCUT|VALABIL/i
          )
        ) {
          addressMatch += ' ' + lines[i + 2]?.trim();
        }
      }
      if (addressMatch && addressMatch.length > 3) {
        fields.address = addressMatch;
      }
    }

    // Document number patterns
    if (line.match(/NR\.|NUMĂRUL|NUMBER/i) && !fields.documentNumber) {
      const numberMatch = line.replace(/NR\.|NUMĂRUL|NUMBER/gi, '').trim();
      if (numberMatch && numberMatch.length > 2) {
        fields.documentNumber = numberMatch;
      }
    }

    // Sex/Gender patterns
    if (line.match(/SEX|GENDER/i) && !fields.sex) {
      const sexMatch = line.replace(/SEX|GENDER/gi, '').trim();
      if (sexMatch && sexMatch.match(/M|F|MASCULIN|FEMININ/i)) {
        fields.sex = sexMatch;
      }
    }
  }

  // Additional pattern matching on full text for missed fields
  if (!fields.cnp) {
    const cnpMatch = fullText.match(/\b\d{13}\b/);
    if (cnpMatch) {
      fields.cnp = cnpMatch[0];
    }
  }

  // Clean up extracted fields
  Object.keys(fields).forEach(key => {
    if (fields[key]) {
      fields[key] = fields[key]
        .replace(/[^\w\s.-/]/g, ' ') // Remove special chars except dots, dashes, slashes
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    }
  });

  console.log('Extracted fields:', fields);
  return fields;
}
