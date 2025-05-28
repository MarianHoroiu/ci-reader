/**
 * AI Integration Utility Functions
 * Helper functions for integrating AI processing with the upload interface
 */

import type {
  RomanianIDFields,
  RomanianIDExtractionResult,
  AIVisionOCRResponse,
  AIVisionErrorCode,
} from '@/lib/types/romanian-id-types';
import { isValidErrorCode } from '@/lib/types/romanian-id-types';

/**
 * Convert File to base64 string for AI processing
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = reader.result.split(',')[1];
        resolve(base64 || '');
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Create FormData for AI API request
 */
export function createAIProcessingFormData(
  file: File,
  options?: {
    temperature?: number;
    max_tokens?: number;
    enhance_image?: boolean;
    custom_prompt?: string;
  }
): FormData {
  const formData = new FormData();
  formData.append('image', file);

  if (options?.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }
  if (options?.max_tokens !== undefined) {
    formData.append('max_tokens', options.max_tokens.toString());
  }
  if (options?.enhance_image !== undefined) {
    formData.append('enhance_image', options.enhance_image.toString());
  }
  if (options?.custom_prompt) {
    formData.append('custom_prompt', options.custom_prompt);
  }

  return formData;
}

/**
 * Process AI API response and handle errors
 */
export function processAIResponse(response: AIVisionOCRResponse): {
  success: boolean;
  data?: RomanianIDExtractionResult;
  error?: {
    code: AIVisionErrorCode;
    message: string;
    details?: any;
  };
} {
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
    };
  }

  // Handle error with proper type conversion
  const errorCode =
    response.error?.code && isValidErrorCode(response.error.code)
      ? response.error.code
      : 'INTERNAL_ERROR';

  return {
    success: false,
    error: {
      code: errorCode,
      message:
        response.error?.message || 'Unknown error occurred during processing',
      details: response.error?.details,
    },
  };
}

/**
 * Format Romanian ID fields for display
 */
export function formatRomanianIDFields(fields: RomanianIDFields): Record<
  string,
  {
    label: string;
    value: string | null;
    formatted: string;
  }
> {
  return {
    nume: {
      label: 'Nume',
      value: fields.nume,
      formatted: fields.nume || 'Nu a fost detectat',
    },
    prenume: {
      label: 'Prenume',
      value: fields.prenume,
      formatted: fields.prenume || 'Nu a fost detectat',
    },
    cnp: {
      label: 'CNP',
      value: fields.cnp,
      formatted: fields.cnp || 'Nu a fost detectat',
    },
    data_nasterii: {
      label: 'Data Nașterii',
      value: fields.data_nasterii,
      formatted: fields.data_nasterii || 'Nu a fost detectată',
    },
    locul_nasterii: {
      label: 'Locul Nașterii',
      value: fields.locul_nasterii,
      formatted: fields.locul_nasterii || 'Nu a fost detectat',
    },
    domiciliul: {
      label: 'Domiciliul',
      value: fields.domiciliul,
      formatted: fields.domiciliul || 'Nu a fost detectat',
    },
    seria_si_numarul: {
      label: 'Seria și Numărul',
      value: fields.seria_si_numarul,
      formatted: fields.seria_si_numarul || 'Nu a fost detectat',
    },
    data_eliberarii: {
      label: 'Data Eliberării',
      value: fields.data_eliberarii,
      formatted: fields.data_eliberarii || 'Nu a fost detectată',
    },
    eliberat_de: {
      label: 'Eliberat de',
      value: fields.eliberat_de,
      formatted: fields.eliberat_de || 'Nu a fost detectat',
    },
    valabil_pana_la: {
      label: 'Valabil până la',
      value: fields.valabil_pana_la,
      formatted: fields.valabil_pana_la || 'Nu a fost detectată',
    },
  };
}

/**
 * Generate export data for Romanian ID extraction
 */
export function generateExportData(
  result: RomanianIDExtractionResult,
  format: 'json' | 'csv' | 'txt' = 'json'
): string {
  const formattedFields = formatRomanianIDFields(result.fields);

  switch (format) {
    case 'json': {
      return JSON.stringify(
        {
          fields: result.fields,
          exported_at: new Date().toISOString(),
        },
        null,
        2
      );
    }

    case 'csv': {
      const csvHeaders = 'Field,Value\n';
      const csvRows = Object.entries(formattedFields)
        .map(([_, field]) => {
          return `"${field.label}","${field.value || ''}"`;
        })
        .join('\n');
      return csvHeaders + csvRows;
    }

    case 'txt': {
      const txtContent = Object.entries(formattedFields)
        .map(([_, field]) => {
          return `${field.label}: ${field.value || 'Nu a fost detectat'}`;
        })
        .join('\n');

      return (
        `Extragere Date Buletin de Identitate Român\n` +
        `Generat la: ${new Date().toLocaleString('ro-RO')}\n\n` +
        txtContent
      );
    }

    default:
      return JSON.stringify(result, null, 2);
  }
}

/**
 * Download exported data as file
 */
export function downloadExportedData(
  data: string,
  filename: string,
  mimeType: string = 'application/json'
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get user-friendly error message for AI processing errors
 */
export function getAIErrorMessage(errorCode: AIVisionErrorCode): string {
  const errorMessages: Record<string, string> = {
    INVALID_IMAGE:
      'Imaginea încărcată nu este validă. Vă rugăm să încărcați o imagine clară a buletinului.',
    IMAGE_TOO_LARGE:
      'Imaginea este prea mare. Vă rugăm să încărcați o imagine mai mică.',
    UNSUPPORTED_FORMAT:
      'Formatul imaginii nu este suportat. Folosiți JPG, PNG sau PDF.',
    MODEL_UNAVAILABLE:
      'Serviciul de procesare AI nu este disponibil momentan. Încercați din nou mai târziu.',
    AI_SERVICE_UNAVAILABLE:
      'Serviciul de procesare AI nu este disponibil momentan. Vă rugăm să încercați din nou mai târziu.',
    PROCESSING_TIMEOUT:
      'Procesarea a durat prea mult timp. Încercați din nou cu o imagine mai mică.',
    EXTRACTION_FAILED:
      'Nu s-au putut extrage datele din imagine. Verificați calitatea imaginii.',
    INVALID_RESPONSE:
      'Răspunsul de la serviciul AI nu este valid. Încercați din nou.',
    INTERNAL_ERROR: 'A apărut o eroare internă. Vă rugăm să încercați din nou.',
  };

  return errorMessages[errorCode] || 'A apărut o eroare necunoscută.';
}
